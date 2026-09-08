import Payment from '../models/Payment.js';
import Provider from '../models/Provider.js';

// @desc    Get payments for a provider
// @route   GET /api/payments
export const getPayments = async (req, res) => {
  try {
    const { providerId, month } = req.query;

    let query = {};
    if (providerId) query.provider = providerId;
    if (month) {
      // month format: YYYY-MM
      query.date = { $regex: `^${month}` };
    }

    const payments = await Payment.find(query)
      .populate('provider', 'name category billingType defaultRate')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record new payment or advance
// @route   POST /api/payments
export const recordPayment = async (req, res) => {
  try {
    const { providerId, date, amount, paymentType, paymentMethod, notes, receiptNumber } = req.body;

    if (!providerId || !date || !amount) {
      return res.status(400).json({ success: false, message: 'Provider, date and amount are required' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const payment = await Payment.create({
      provider: providerId,
      date,
      amount: Number(amount),
      paymentType: paymentType || 'Advance',
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      receiptNumber: receiptNumber || '',
    });

    const populated = await payment.populate('provider', 'name category');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a payment
// @route   PUT /api/payments/:id
export const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('provider', 'name category');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
