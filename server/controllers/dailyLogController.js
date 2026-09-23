import DailyLog from '../models/DailyLog.js';
import Provider from '../models/Provider.js';
import Candidate from '../models/Candidate.js';

const resolveCandidateIds = async (candidateIds) => {
  const ids = Array.isArray(candidateIds)
    ? candidateIds
    : candidateIds
      ? [candidateIds]
      : [];

  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return [];

  const found = await Candidate.find({ _id: { $in: unique } }).select('_id');
  return found.map((c) => c._id);
};

// @desc    Get daily logs for a provider
// @route   GET /api/daily-logs
export const getDailyLogs = async (req, res) => {
  try {
    const { providerId, month, startDate, endDate } = req.query;

    if (!providerId) {
      return res.status(400).json({ success: false, message: 'providerId is required' });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upsert (Create or Update) a single daily log
// @route   POST /api/daily-logs
export const upsertDailyLog = async (req, res) => {
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
      return res.status(400).json({ success: false, message: 'providerId and date are required' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const incomingIds =
      candidateIds !== undefined
        ? candidateIds
        : candidateId
          ? [candidateId]
          : [];
    const candidates = await resolveCandidateIds(incomingIds);

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
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Bulk upsert daily logs for a provider
// @route   POST /api/daily-logs/bulk
export const bulkUpsertDailyLogs = async (req, res) => {
  try {
    const { providerId, logs } = req.body;

    if (!providerId || !Array.isArray(logs)) {
      return res.status(400).json({ success: false, message: 'providerId and logs array are required' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const operations = [];
    for (const item of logs) {
      const incomingIds =
        item.candidateIds !== undefined
          ? item.candidateIds
          : item.candidateId
            ? [item.candidateId]
            : [];
      const candidates = await resolveCandidateIds(incomingIds);
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete daily log
// @route   DELETE /api/daily-logs/:id
export const deleteDailyLog = async (req, res) => {
  try {
    const log = await DailyLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Daily log not found' });
    }
    res.json({ success: true, message: 'Daily log deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
