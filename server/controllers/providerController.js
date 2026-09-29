import Provider from '../models/Provider.js';
import DailyLog from '../models/DailyLog.js';
import Payment from '../models/Payment.js';
import AppError from '../utils/AppError.js';

// @desc    Get all providers
// @route   GET /api/providers
export const getProviders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const providers = await Provider.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single provider
// @route   GET /api/providers/:id
export const getProviderById = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return next(new AppError('Provider not found', 404));
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new provider
// @route   POST /api/providers
export const createProvider = async (req, res, next) => {
  try {
    const { name, category, billingType, defaultRate, unit, phone, notes } = req.body;
    
    if (!name || defaultRate === undefined) {
      return next(new AppError('Name and rate are required', 400));
    }

    const provider = await Provider.create({
      name,
      category: category || 'Other',
      billingType: billingType || 'daily_unit',
      defaultRate: Number(defaultRate),
      unit: unit || (billingType === 'monthly_fixed' ? 'Month' : 'Liter'),
      phone: phone || '',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Update provider
// @route   PUT /api/providers/:id
export const updateProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!provider) {
      return next(new AppError('Provider not found', 404));
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete provider
// @route   DELETE /api/providers/:id
export const deleteProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return next(new AppError('Provider not found', 404));
    }

    // Also delete associated logs and payments
    await DailyLog.deleteMany({ provider: req.params.id });
    await Payment.deleteMany({ provider: req.params.id });
    await provider.deleteOne();

    res.json({ success: true, message: 'Provider and all associated records deleted successfully' });
  } catch (error) {
    next(error);
  }
};
