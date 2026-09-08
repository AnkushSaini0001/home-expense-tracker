import Provider from '../models/Provider.js';
import DailyLog from '../models/DailyLog.js';
import Payment from '../models/Payment.js';

// @desc    Get all providers
// @route   GET /api/providers
export const getProviders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const providers = await Provider.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single provider
// @route   GET /api/providers/:id
export const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new provider
// @route   POST /api/providers
export const createProvider = async (req, res) => {
  try {
    const { name, category, billingType, defaultRate, unit, phone, notes } = req.body;
    
    if (!name || defaultRate === undefined) {
      return res.status(400).json({ success: false, message: 'Name and rate are required' });
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
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update provider
// @route   PUT /api/providers/:id
export const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete provider
// @route   DELETE /api/providers/:id
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Also delete associated logs and payments
    await DailyLog.deleteMany({ provider: req.params.id });
    await Payment.deleteMany({ provider: req.params.id });
    await provider.deleteOne();

    res.json({ success: true, message: 'Provider and all associated records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
