import Payment from '../models/Payment.js';
import Provider from '../models/Provider.js';
import AppError from '../utils/AppError.js';

// @desc    Get payments for a provider
// @route   GET /api/payments
export const getPayments = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Record new payment or advance
// @route   POST /api/payments
export const recordPayment = async (req, res, next) => {
  try {
    const { providerId, date, amount, paymentType, paymentMethod, notes, receiptNumber } = req.body;

    if (!providerId || !date || !amount) {
      return next(new AppError('Provider, date and amount are required', 400));
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return next(new AppError('Provider not found', 404));
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
    next(error);
  }
};

// @desc    Update a payment
// @route   PUT /api/payments/:id
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('provider', 'name category');

    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
