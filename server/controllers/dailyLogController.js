import DailyLog from '../models/DailyLog.js';
import Provider from '../models/Provider.js';
import Candidate from '../models/Candidate.js';
import { isCandidateForCategory } from '../utils/candidateScope.js';
import AppError from '../utils/AppError.js';

const resolveCandidateIds = async (candidateIds, providerCategory) => {
  const ids = Array.isArray(candidateIds)
    ? candidateIds
    : candidateIds
      ? [candidateIds]
      : [];

  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return [];

  const found = await Candidate.find({ _id: { $in: unique } });
  return found
    .filter((c) => isCandidateForCategory(c, providerCategory))
    .map((c) => c._id);
};

// @desc    Get daily logs for a provider
// @route   GET /api/daily-logs
export const getDailyLogs = async (req, res, next) => {
  try {
    const { providerId, month, startDate, endDate } = req.query;

    if (!providerId) {
      return next(new AppError('providerId is required', 400));
    }

    let dateQuery = {};
    if (month) {
      dateQuery = { date: { $regex: `^${month}` } };
    } else if (startDate && endDate) {
      dateQuery = { date: { $gte: startDate, $lte: endDate } };
    }

    const logs = await DailyLog.find({
      provider: providerId,
      ...dateQuery,
    })
      .populate('candidates', 'name status')
      .sort({ date: 1 });

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Upsert (Create or Update) a single daily log
// @route   POST /api/daily-logs
export const upsertDailyLog = async (req, res, next) => {
  try {
    const {
      providerId,
      date,
      quantity,
      rate,
      status,
      notes,
      candidateIds,
      candidateId, // legacy single-select support
    } = req.body;

    if (!providerId || !date) {
      return next(new AppError('providerId and date are required', 400));
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new AppError('Provider not found', 404));
    }

    const incomingIds =
      candidateIds !== undefined
        ? candidateIds
        : candidateId
          ? [candidateId]
          : [];
    const candidates = await resolveCandidateIds(incomingIds, provider.category);

    const appliedRate = rate !== undefined && rate !== null ? Number(rate) : provider.defaultRate;
    const appliedQty = quantity !== undefined ? Number(quantity) : 1;
    const appliedStatus = status || 'delivered';

    const calculatedAmount =
      appliedStatus === 'absent' || appliedStatus === 'holiday'
        ? 0
        : Number((appliedQty * appliedRate).toFixed(2));

    const log = await DailyLog.findOneAndUpdate(
      { provider: providerId, date },
      {
        $set: {
          provider: providerId,
          date,
          candidates,
          quantity: appliedQty,
          rate: appliedRate,
          amount: calculatedAmount,
          status: appliedStatus,
          notes: notes || '',
        },
        $unset: { candidate: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await log.populate('candidates', 'name status');

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upsert daily logs for a provider
// @route   POST /api/daily-logs/bulk
export const bulkUpsertDailyLogs = async (req, res, next) => {
  try {
    const { providerId, logs } = req.body;

    if (!providerId || !Array.isArray(logs)) {
      return next(new AppError('providerId and logs array are required', 400));
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new AppError('Provider not found', 404));
    }

    const operations = [];
    for (const item of logs) {
      const incomingIds =
        item.candidateIds !== undefined
          ? item.candidateIds
          : item.candidateId
            ? [item.candidateId]
            : [];
      const candidates = await resolveCandidateIds(incomingIds, provider.category);
      const appliedRate =
        item.rate !== undefined && item.rate !== null ? Number(item.rate) : provider.defaultRate;
      const appliedQty = item.quantity !== undefined ? Number(item.quantity) : 1;
      const appliedStatus = item.status || 'delivered';
      const calculatedAmount =
        appliedStatus === 'absent' || appliedStatus === 'holiday'
          ? 0
          : Number((appliedQty * appliedRate).toFixed(2));

      operations.push({
        updateOne: {
          filter: { provider: providerId, date: item.date },
          update: {
            $set: {
              provider: providerId,
              date: item.date,
              candidates,
              quantity: appliedQty,
              rate: appliedRate,
              amount: calculatedAmount,
              status: appliedStatus,
              notes: item.notes || '',
            },
            $unset: { candidate: 1 },
          },
          upsert: true,
        },
      });
    }

    const result = await DailyLog.bulkWrite(operations);
    res.json({ success: true, message: 'Bulk logs processed successfully', result });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete daily log
// @route   DELETE /api/daily-logs/:id
export const deleteDailyLog = async (req, res, next) => {
  try {
    const log = await DailyLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return next(new AppError('Daily log not found', 404));
    }
    res.json({ success: true, message: 'Daily log deleted successfully' });
  } catch (error) {
    next(error);
  }
};
