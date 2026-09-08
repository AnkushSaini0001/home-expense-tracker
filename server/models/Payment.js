import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider reference is required'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Payment date (YYYY-MM-DD) is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentType: {
      type: String,
      enum: ['Advance', 'Mid-month', 'Settlement', 'Bonus', 'Other'],
      default: 'Advance',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ provider: 1, date: 1 });

export default mongoose.model('Payment', paymentSchema);
