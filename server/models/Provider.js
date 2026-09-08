import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Provider name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Milkman', 'Cook', 'Maid', 'Driver', 'Gardener', 'Newspaper', 'Other'],
      default: 'Other',
    },
    billingType: {
      type: String,
      required: true,
      enum: ['daily_unit', 'monthly_fixed'],
      default: 'daily_unit',
    },
    defaultRate: {
      type: Number,
      required: [true, 'Default rate or monthly wage is required'],
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'Liter', // e.g. Liter, Packet, Day, Month
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Provider', providerSchema);
