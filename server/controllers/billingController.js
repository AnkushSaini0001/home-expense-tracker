import Provider from '../models/Provider.js';
import DailyLog from '../models/DailyLog.js';
import Payment from '../models/Payment.js';
import Candidate from '../models/Candidate.js';
import { filterCandidatesForCategory, isCandidateForCategory } from '../utils/candidateScope.js';

/** Categories that get 2 free leave days per month */
const FREE_LEAVE_CATEGORIES = new Set(['Cook', 'Maid']);
const FREE_LEAVES_PER_MONTH = 2;

// Helper to get number of days in a month YYYY-MM
const getDaysInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

// Helper to get month name
const formatMonthName = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const allowsFreeLeaves = (category) => FREE_LEAVE_CATEGORIES.has(category);

/**
 * Compute monthly_fixed billed amount with optional free-leave allowance.
 * Cook & Maid (cleaner): first 2 absents/month are free; extra absents deduct per-day rate.
 */
const computeMonthlyFixedBilling = (provider, logs, month) => {
  const daysInMonth = getDaysInMonth(month);
  const perDayRate = provider.defaultRate / daysInMonth;

  let daysDelivered = 0;
  let daysAbsent = 0;

  logs.forEach((log) => {
    if (log.status === 'absent') {
      daysAbsent += 1;
    } else if (log.status === 'delivered' || log.status === 'extra') {
      daysDelivered += 1;
    }
  });

  const freeLeavesAllowed = allowsFreeLeaves(provider.category) ? FREE_LEAVES_PER_MONTH : 0;
  const freeLeavesUsed = Math.min(daysAbsent, freeLeavesAllowed);
  const deductibleLeaves = Math.max(0, daysAbsent - freeLeavesAllowed);
  const leaveDeduction =
    deductibleLeaves > 0
      ? Number((deductibleLeaves * perDayRate).toFixed(2))
      : 0;

  const totalBilled = Math.max(
    0,
    Number((provider.defaultRate - leaveDeduction).toFixed(2))
  );

  return {
    daysDelivered,
    daysAbsent,
    daysInMonth,
    perDayRate: Number(perDayRate.toFixed(2)),
    freeLeavesAllowed,
    freeLeavesUsed,
    deductibleLeaves,
    leaveDeduction,
    totalBilled,
  };
};

const computeDailyUnitBilling = (logs) => {
  let totalUnits = 0;
  let daysDelivered = 0;
  let daysAbsent = 0;
  let totalBilled = 0;

  logs.forEach((log) => {
    if (log.status === 'delivered' || log.status === 'extra') {
      totalUnits += log.quantity || 0;
      daysDelivered += 1;
    } else if (log.status === 'absent') {
      daysAbsent += 1;
    }
    totalBilled += log.amount || 0;
  });

  return {
    totalUnits: Number(totalUnits.toFixed(2)),
    daysDelivered,
    daysAbsent,
    totalBilled: Number(totalBilled.toFixed(2)),
    freeLeavesAllowed: 0,
    freeLeavesUsed: 0,
    deductibleLeaves: 0,
    leaveDeduction: 0,
  };
};

/**
 * Split provider bill across household candidates.
 * - Log with candidates[] → split amount/qty among those people only
 * - Log with empty candidates (All) → split equally among everyone
 * - daily_unit + fixedDailyQuantity (e.g. Reena 0.5L): only when that person
 *   is on the log (All, or explicitly selected). They take fixed liters first;
 *   remainder goes to other selected candidates. If they are not selected,
 *   they get nothing and the full qty splits among the chosen people.
 * - monthly_fixed salary → split totalBilled equally
 * - Advances paid → credited equally
 */
const computeCandidateShares = ({
  candidates,
  logs,
  billingType,
  totalBilled,
  totalPaid,
  unit = 'Liter',
}) => {
  if (!candidates.length) return [];

  const n = candidates.length;
  const shares = candidates.map((c) => ({
    candidateId: c._id,
    name: c.name,
    billedShare: 0,
    paidShare: 0,
    pendingShare: 0,
    quantityShare: 0,
    unit,
  }));

  const byId = Object.fromEntries(shares.map((s) => [String(s.candidateId), s]));

  const fixedCandidates = candidates.filter(
    (c) => Number(c.fixedDailyQuantity) > 0
  );
  const fixedIdSet = new Set(fixedCandidates.map((c) => String(c._id)));

  const credit = (id, amount, quantity) => {
    const row = byId[String(id)];
    if (!row) return;
    row.billedShare += amount;
    row.quantityShare += quantity;
  };

  const addSplit = (amount, quantity, targetIds = null) => {
    const targets = targetIds?.length
      ? targetIds.filter((id) => byId[String(id)])
      : shares.map((s) => s.candidateId);
    if (!targets.length) return;
    const eachAmount = amount / targets.length;
    const eachQty = quantity / targets.length;
    targets.forEach((id) => credit(id, eachAmount, eachQty));
  };

  const getLogCandidateIds = (log) => {
    if (Array.isArray(log.candidates) && log.candidates.length > 0) {
      return log.candidates.map((c) => c?._id || c).filter(Boolean);
    }
    const legacy = log.candidate?._id || log.candidate;
    return legacy ? [legacy] : [];
  };

  if (billingType === 'daily_unit') {
    logs.forEach((log) => {
      const isBillable = log.status === 'delivered' || log.status === 'extra';
      const amount = Number(log.amount) || 0;
      const quantity = isBillable ? Number(log.quantity) || 0 : 0;
      if (amount <= 0 && quantity <= 0) return;

      const assigned = getLogCandidateIds(log);
      const isAll = !assigned.length;
      const selectedIds = isAll
        ? shares.map((s) => s.candidateId)
        : assigned.filter((id) => byId[String(id)]);

      if (!selectedIds.length) return;

      // Fixed allotment (Reena 0.5L) only if they are part of this log
      const fixedOnLog = fixedCandidates.filter((fc) =>
        selectedIds.some((id) => String(id) === String(fc._id))
      );

      if (!fixedOnLog.length || quantity <= 0) {
        addSplit(amount, quantity, selectedIds);
        return;
      }

      let qtyLeft = quantity;
      let amountLeft = amount;
      const ratePerUnit = quantity > 0 ? amount / quantity : 0;
      const fixedOnLogIds = new Set(fixedOnLog.map((c) => String(c._id)));

      fixedOnLog.forEach((fc) => {
        const takeQty = Math.min(Number(fc.fixedDailyQuantity) || 0, qtyLeft);
        if (takeQty <= 0) return;
        const takeAmount = ratePerUnit * takeQty;
        credit(fc._id, takeAmount, takeQty);
        qtyLeft -= takeQty;
        amountLeft -= takeAmount;
      });

      const restTargets = selectedIds.filter(
        (id) => !fixedOnLogIds.has(String(id))
      );
      if (qtyLeft > 0 || amountLeft > 0) {
        if (restTargets.length) {
          addSplit(amountLeft, qtyLeft, restTargets);
        } else {
          addSplit(
            amountLeft,
            qtyLeft,
            fixedOnLog.map((c) => c._id)
          );
        }
      }
    });
  } else {
    addSplit(totalBilled, 0, null);
  }

  const paidEach = totalPaid / n;
  shares.forEach((s) => {
    s.billedShare = Number(s.billedShare.toFixed(2));
    s.paidShare = Number(paidEach.toFixed(2));
    s.pendingShare = Number((s.billedShare - s.paidShare).toFixed(2));
    s.quantityShare = Number(s.quantityShare.toFixed(2));
  });

  return shares;
};

// @desc    Get monthly billing summary for a specific provider
// @route   GET /api/billing/summary/:providerId
export const getProviderMonthlySummary = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { month } = req.query; // Format: YYYY-MM

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month query param (YYYY-MM) is required' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // 1. Fetch daily logs for the month
    const logs = await DailyLog.find({
      provider: providerId,
      date: { $regex: `^${month}` },
    })
      .populate('candidates', 'name status')
      .sort({ date: 1 });

    // 2. Fetch payments for the month
    const payments = await Payment.find({
      provider: providerId,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    const allCandidates = await Candidate.find({ status: 'active' }).sort({ name: 1 });
    const candidates = filterCandidatesForCategory(allCandidates, provider.category);

    // 3. Compute billing based on provider type
    let totalUnits = 0;
    let daysDelivered = 0;
    let daysAbsent = 0;
    let totalBilled = 0;
    let freeLeavesAllowed = 0;
    let freeLeavesUsed = 0;
    let deductibleLeaves = 0;
    let leaveDeduction = 0;
    let daysInMonth = null;
    let perDayRate = null;

    if (provider.billingType === 'daily_unit') {
      const computed = computeDailyUnitBilling(logs);
      totalUnits = computed.totalUnits;
      daysDelivered = computed.daysDelivered;
      daysAbsent = computed.daysAbsent;
      totalBilled = computed.totalBilled;
    } else {
      // monthly_fixed (Cook, Maid/cleaner, etc.)
      const computed = computeMonthlyFixedBilling(provider, logs, month);
      daysDelivered = computed.daysDelivered;
      daysAbsent = computed.daysAbsent;
      totalBilled = computed.totalBilled;
      freeLeavesAllowed = computed.freeLeavesAllowed;
      freeLeavesUsed = computed.freeLeavesUsed;
      deductibleLeaves = computed.deductibleLeaves;
      leaveDeduction = computed.leaveDeduction;
      daysInMonth = computed.daysInMonth;
      perDayRate = computed.perDayRate;
    }

    // 4. Compute payments & advances
    let totalAdvance = 0;
    let totalSettlement = 0;
    let totalPaid = 0;

    payments.forEach((p) => {
      totalPaid += p.amount;
      if (p.paymentType === 'Advance' || p.paymentType === 'Mid-month') {
        totalAdvance += p.amount;
      } else {
        totalSettlement += p.amount;
      }
    });

    totalPaid = Number(totalPaid.toFixed(2));
    totalAdvance = Number(totalAdvance.toFixed(2));
    totalSettlement = Number(totalSettlement.toFixed(2));

    const pendingBalance = Number((totalBilled - totalPaid).toFixed(2));

    const candidateShares = computeCandidateShares({
      candidates,
      logs,
      billingType: provider.billingType,
      totalBilled,
      totalPaid,
      unit: provider.unit || 'Liter',
    });

    // 5. Generate formatted WhatsApp / printable summary string
    const monthFormatted = formatMonthName(month);
    let billDetails = '';
    if (provider.billingType === 'daily_unit') {
      billDetails = `📦 *Deliveries:* ${daysDelivered} days (${totalUnits} ${provider.unit || 'Units'}) @ ₹${provider.defaultRate}/${provider.unit || 'unit'}\n💰 *Total Billed:* ₹${totalBilled.toLocaleString('en-IN')}`;
    } else {
      let leaveNote = '';
      if (daysAbsent > 0) {
        if (freeLeavesAllowed > 0) {
          leaveNote = ` (Leaves: ${daysAbsent} taken, ${freeLeavesUsed} free, ${deductibleLeaves} deducted${leaveDeduction > 0 ? ` −₹${leaveDeduction.toLocaleString('en-IN')}` : ''})`;
        } else {
          leaveNote = ` (Deductions: ${daysAbsent} absent days)`;
        }
      }
      billDetails = `💼 *Monthly Salary:* ₹${provider.defaultRate.toLocaleString('en-IN')}${leaveNote}\n💰 *Total Billed:* ₹${totalBilled.toLocaleString('en-IN')}`;
    }

    let candidateBlock = '';
    if (candidateShares.length > 0) {
      const isDaily = provider.billingType === 'daily_unit';
      const unitLabel = provider.unit || 'Liter';
      const lines = candidateShares
        .map((s) => {
          const qtyPart =
            isDaily && s.quantityShare > 0
              ? ` | qty ${s.quantityShare} ${unitLabel}`
              : '';
          return `• ${s.name}: billed ₹${s.billedShare.toLocaleString('en-IN')}${qtyPart} | paid ₹${s.paidShare.toLocaleString('en-IN')} | due ₹${s.pendingShare.toLocaleString('en-IN')}`;
        })
        .join('\n');
      candidateBlock = `\n👥 *Per Candidate Share:*\n${lines}\n`;
    }

    const shareableSummary =
`🧾 *HOUSEHOLD BILL STATEMENT*
📅 *Month:* ${monthFormatted}
👤 *Provider:* ${provider.name} (${provider.category})

${billDetails}
💸 *Advances / Paid:* ₹${totalPaid.toLocaleString('en-IN')} (${payments.length} payments)
${candidateBlock}----------------------------------
${pendingBalance >= 0 ? '⏳ *Balance Pending:*' : '✅ *Overpaid / Credit:*'} ₹${Math.abs(pendingBalance).toLocaleString('en-IN')}

_Note: Untagged (All) includes Reena at 0.5 L/day then splits the rest. If Reena is not selected, full qty goes to chosen candidates only._
_Generated via Household Billing Tracker_`;

    res.json({
      success: true,
      data: {
        provider,
        month,
        monthFormatted,
        billing: {
          billingType: provider.billingType,
          rate: provider.defaultRate,
          unit: provider.unit,
          totalUnits,
          daysDelivered,
          daysAbsent,
          daysInMonth,
          perDayRate,
          freeLeavesAllowed,
          freeLeavesUsed,
          deductibleLeaves,
          leaveDeduction,
          totalBilled,
          totalAdvance,
          totalSettlement,
          totalPaid,
          pendingBalance,
          isFullyPaid: pendingBalance <= 0,
          candidateShares,
        },
        logs,
        payments,
        candidates,
        shareableSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard overview for all providers for a month
// @route   GET /api/billing/overview
export const getDashboardOverview = async (req, res) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month query param (YYYY-MM) is required' });
    }

    const providers = await Provider.find({ status: 'active' }).sort({ category: 1, name: 1 });

    let overallBilled = 0;
    let overallAdvance = 0;
    let overallPaid = 0;
    let overallPending = 0;

    const providerSummaries = await Promise.all(
      providers.map(async (provider) => {
        // Logs for month
        const logs = await DailyLog.find({
          provider: provider._id,
          date: { $regex: `^${month}` },
        });

        // Payments for month
        const payments = await Payment.find({
          provider: provider._id,
          date: { $regex: `^${month}` },
        });

        let totalUnits = 0;
        let daysDelivered = 0;
        let daysAbsent = 0;
        let totalBilled = 0;
        let freeLeavesAllowed = 0;
        let freeLeavesUsed = 0;
        let deductibleLeaves = 0;
        let leaveDeduction = 0;

        if (provider.billingType === 'daily_unit') {
          const computed = computeDailyUnitBilling(logs);
          totalUnits = computed.totalUnits;
          daysDelivered = computed.daysDelivered;
          daysAbsent = computed.daysAbsent;
          totalBilled = computed.totalBilled;
        } else {
          const computed = computeMonthlyFixedBilling(provider, logs, month);
          daysDelivered = computed.daysDelivered;
          daysAbsent = computed.daysAbsent;
          totalBilled = computed.totalBilled;
          freeLeavesAllowed = computed.freeLeavesAllowed;
          freeLeavesUsed = computed.freeLeavesUsed;
          deductibleLeaves = computed.deductibleLeaves;
          leaveDeduction = computed.leaveDeduction;
        }

        let totalAdvance = 0;
        let totalPaid = 0;

        payments.forEach((p) => {
          totalPaid += p.amount;
          if (p.paymentType === 'Advance' || p.paymentType === 'Mid-month') {
            totalAdvance += p.amount;
          }
        });

        totalPaid = Number(totalPaid.toFixed(2));
        totalAdvance = Number(totalAdvance.toFixed(2));
        const pendingBalance = Number((totalBilled - totalPaid).toFixed(2));

        overallBilled += totalBilled;
        overallAdvance += totalAdvance;
        overallPaid += totalPaid;
        overallPending += pendingBalance;

        return {
          provider,
          totalUnits,
          daysDelivered,
          daysAbsent,
          freeLeavesAllowed,
          freeLeavesUsed,
          deductibleLeaves,
          leaveDeduction,
          totalBilled,
          totalAdvance,
          totalPaid,
          pendingBalance,
          paymentsCount: payments.length,
          logsCount: logs.length,
        };
      })
    );

    res.json({
      success: true,
      data: {
        month,
        monthFormatted: formatMonthName(month),
        totals: {
          totalBilled: Number(overallBilled.toFixed(2)),
          totalAdvance: Number(overallAdvance.toFixed(2)),
          totalPaid: Number(overallPaid.toFixed(2)),
          totalPending: Number(overallPending.toFixed(2)),
          providersCount: providers.length,
        },
        providers: providerSummaries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Build one provider month summary + that candidate's share (internal helper).
 */
const buildProviderCandidateSection = async (provider, month, candidate) => {
  if (!isCandidateForCategory(candidate, provider.category)) {
    return null;
  }

  const logs = await DailyLog.find({
    provider: provider._id,
    date: { $regex: `^${month}` },
  })
    .populate('candidates', 'name status')
    .sort({ date: 1 });

  const payments = await Payment.find({
    provider: provider._id,
    date: { $regex: `^${month}` },
  }).sort({ date: 1 });

  const allCandidates = await Candidate.find({ status: 'active' }).sort({ name: 1 });
  const scopedCandidates = filterCandidatesForCategory(allCandidates, provider.category);

  let totalUnits = 0;
  let daysDelivered = 0;
  let daysAbsent = 0;
  let totalBilled = 0;
  let freeLeavesAllowed = 0;
  let freeLeavesUsed = 0;
  let deductibleLeaves = 0;
  let leaveDeduction = 0;
  let daysInMonth = null;
  let perDayRate = null;

  if (provider.billingType === 'daily_unit') {
    const computed = computeDailyUnitBilling(logs);
    totalUnits = computed.totalUnits;
    daysDelivered = computed.daysDelivered;
    daysAbsent = computed.daysAbsent;
    totalBilled = computed.totalBilled;
  } else {
    const computed = computeMonthlyFixedBilling(provider, logs, month);
    daysDelivered = computed.daysDelivered;
    daysAbsent = computed.daysAbsent;
    totalBilled = computed.totalBilled;
    freeLeavesAllowed = computed.freeLeavesAllowed;
    freeLeavesUsed = computed.freeLeavesUsed;
    deductibleLeaves = computed.deductibleLeaves;
    leaveDeduction = computed.leaveDeduction;
    daysInMonth = computed.daysInMonth;
    perDayRate = computed.perDayRate;
  }

  let totalPaid = 0;
  let totalAdvance = 0;
  let totalSettlement = 0;
  payments.forEach((p) => {
    totalPaid += p.amount;
    if (p.paymentType === 'Advance' || p.paymentType === 'Mid-month') {
      totalAdvance += p.amount;
    } else {
      totalSettlement += p.amount;
    }
  });
  totalPaid = Number(totalPaid.toFixed(2));
  totalAdvance = Number(totalAdvance.toFixed(2));
  totalSettlement = Number(totalSettlement.toFixed(2));

  const candidateShares = computeCandidateShares({
    candidates: scopedCandidates,
    logs,
    billingType: provider.billingType,
    totalBilled,
    totalPaid,
    unit: provider.unit || 'Liter',
  });

  const share = candidateShares.find(
    (s) => String(s.candidateId) === String(candidate._id)
  );

  if (!share) return null;

  const candidateIdStr = String(candidate._id);
  const relevantLogs = logs.filter((log) => {
    const ids =
      Array.isArray(log.candidates) && log.candidates.length > 0
        ? log.candidates.map((c) => String(c?._id || c))
        : [];
    // Empty = All → candidate is included for this facility
    if (!ids.length) return true;
    return ids.includes(candidateIdStr);
  });

  return {
    provider: {
      _id: provider._id,
      name: provider.name,
      category: provider.category,
      billingType: provider.billingType,
      defaultRate: provider.defaultRate,
      unit: provider.unit,
      phone: provider.phone,
    },
    billing: {
      billingType: provider.billingType,
      rate: provider.defaultRate,
      unit: provider.unit,
      totalUnits,
      daysDelivered,
      daysAbsent,
      daysInMonth,
      perDayRate,
      freeLeavesAllowed,
      freeLeavesUsed,
      deductibleLeaves,
      leaveDeduction,
      providerTotalBilled: totalBilled,
      providerTotalPaid: totalPaid,
      providerPending: Number((totalBilled - totalPaid).toFixed(2)),
    },
    share: {
      billedShare: share.billedShare,
      paidShare: share.paidShare,
      pendingShare: share.pendingShare,
      quantityShare: share.quantityShare,
      unit: share.unit,
    },
    logs: relevantLogs,
    payments,
  };
};

// @desc    Generate monthly bill for one candidate (one or all providers)
// @route   GET /api/billing/candidate-bill
export const getCandidateMonthlyBill = async (req, res) => {
  try {
    const { month, candidateId, providerId } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month query param (YYYY-MM) is required',
      });
    }
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'candidateId query param is required',
      });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate || candidate.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found or inactive',
      });
    }

    let providers;
    if (providerId && providerId !== 'all') {
      const one = await Provider.findById(providerId);
      if (!one || one.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Provider not found or inactive',
        });
      }
      providers = [one];
    } else {
      providers = await Provider.find({ status: 'active' }).sort({
        category: 1,
        name: 1,
      });
    }

    const sections = [];
    for (const provider of providers) {
      const section = await buildProviderCandidateSection(
        provider,
        month,
        candidate
      );
      if (section) sections.push(section);
    }

    const totals = sections.reduce(
      (acc, s) => {
        acc.billed += s.share.billedShare;
        acc.paid += s.share.paidShare;
        acc.pending += s.share.pendingShare;
        acc.quantity += s.share.quantityShare || 0;
        return acc;
      },
      { billed: 0, paid: 0, pending: 0, quantity: 0 }
    );

    const monthFormatted = formatMonthName(month);
    const providerFilterLabel =
      providerId && providerId !== 'all'
        ? sections[0]?.provider?.name || 'Selected provider'
        : 'All providers';

    const detailLines = sections
      .map((s) => {
        const qty =
          s.billing.billingType === 'daily_unit' && s.share.quantityShare > 0
            ? ` | ${s.share.quantityShare} ${s.share.unit || 'Liter'}`
            : '';
        return `• ${s.provider.name} (${s.provider.category}): billed ₹${s.share.billedShare.toLocaleString('en-IN')}${qty} | paid ₹${s.share.paidShare.toLocaleString('en-IN')} | due ₹${s.share.pendingShare.toLocaleString('en-IN')}`;
      })
      .join('\n');

    const shareableSummary =
`🧾 *CANDIDATE MONTHLY BILL*
📅 *Month:* ${monthFormatted}
👤 *Candidate:* ${candidate.name}
🏢 *Providers:* ${providerFilterLabel}

${detailLines || '• No billable share for this selection'}

----------------------------------
💰 *Total Billed:* ₹${Number(totals.billed.toFixed(2)).toLocaleString('en-IN')}
💸 *Paid Credit:* ₹${Number(totals.paid.toFixed(2)).toLocaleString('en-IN')}
⏳ *Balance Due:* ₹${Number(totals.pending.toFixed(2)).toLocaleString('en-IN')}

_Generated via Household Billing Tracker_`;

    res.json({
      success: true,
      data: {
        month,
        monthFormatted,
        candidate: {
          _id: candidate._id,
          name: candidate.name,
          applicableCategories: candidate.applicableCategories,
          excludedCategories: candidate.excludedCategories,
        },
        providerFilter: providerId && providerId !== 'all' ? providerId : 'all',
        sections,
        totals: {
          billed: Number(totals.billed.toFixed(2)),
          paid: Number(totals.paid.toFixed(2)),
          pending: Number(totals.pending.toFixed(2)),
          quantity: Number(totals.quantity.toFixed(2)),
          providersCount: sections.length,
        },
        shareableSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
