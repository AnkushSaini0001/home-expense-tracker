import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    /**
     * Provider categories this candidate can be billed for.
     * Empty array = all facilities (unless excluded).
     * e.g. ['Milkman'] means milk only (Reena).
     */
    applicableCategories: {
      type: [String],
      default: [],
    },
    /**
     * Provider categories where this candidate must NOT appear.
     * e.g. ['Cook'] hides Jatin from Cook.
     */
    excludedCategories: {
      type: [String],
      default: [],
    },
    /**
     * For daily_unit (milk): take this many liters from every delivery first.
     * Remainder is split among other selected candidates.
     * e.g. Reena → 0.5
     */
    fixedDailyQuantity: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Candidate', candidateSchema);
