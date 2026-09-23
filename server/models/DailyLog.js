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
     * Optional household member this entry belongs to.
     * null / missing = shared by all candidates (split equally on bill).
     */
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
      index: true,
    },
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

// One log per provider + date + candidate (null candidate = shared "All")
dailyLogSchema.index(
  { provider: 1, date: 1, candidate: 1 },
  { unique: true }
);

export default mongoose.model('DailyLog', dailyLogSchema);
