import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: [true, 'Provider reference is required'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true,
    },
    /**
     * Household members this entry belongs to.
     * Empty array = shared by all candidates (split equally on bill).
     */
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
      },
    ],
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['delivered', 'absent', 'extra', 'holiday'],
      default: 'delivered',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One log per provider per date
dailyLogSchema.index({ provider: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyLog', dailyLogSchema);
