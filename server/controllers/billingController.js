import Provider from '../models/Provider.js';
import DailyLog from '../models/DailyLog.js';
import Payment from '../models/Payment.js';

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
    }).sort({ date: 1 });

    // 2. Fetch payments for the month
    const payments = await Payment.find({
      provider: providerId,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

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

    const shareableSummary =
`🧾 *HOUSEHOLD BILL STATEMENT*
📅 *Month:* ${monthFormatted}
👤 *Provider:* ${provider.name} (${provider.category})

${billDetails}
💸 *Advances / Paid:* ₹${totalPaid.toLocaleString('en-IN')} (${payments.length} payments)
----------------------------------
${pendingBalance >= 0 ? '⏳ *Balance Pending:*' : '✅ *Overpaid / Credit:*'} ₹${Math.abs(pendingBalance).toLocaleString('en-IN')}

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
        },
        logs,
        payments,
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
