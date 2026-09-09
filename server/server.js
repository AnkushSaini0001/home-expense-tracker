import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import dailyLogRoutes from './routes/dailyLogRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';

import User from './models/User.js';
import Provider from './models/Provider.js';
import DailyLog from './models/DailyLog.js';
import Payment from './models/Payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/billing', billingRoutes);
app.get('/', (req, res) => {
  res.json({
    message: 'Household Billing API is running',
  });
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auto seed helper for users and sample household providers
const autoSeedIfEmpty = async () => {
  try {
    // 1. Seed default Admin and User accounts if not present
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('👤 Seeding default Admin user (admin / admin123)...');
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Home Admin',
      });
    }

    const userExists = await User.findOne({ username: 'user' });
    if (!userExists) {
      console.log('👤 Seeding default View-only user (user / user123)...');
      await User.create({
        username: 'user',
        password: 'user123',
        role: 'user',
        name: 'Family Member (Viewer)',
      });
    }

    // 2. Seed sample providers if none exist
    const count = await Provider.countDocuments();
    if (count === 0) {
      console.log('🌱 Empty database detected. Seeding sample household providers...');

      const milkman = await Provider.create({
        name: 'Ramesh (Milkman)',
        category: 'Milkman',
        billingType: 'daily_unit',
        defaultRate: 66,
        unit: 'Liter',
        phone: '+91 98765 43210',
        notes: 'Delivers fresh buffalo milk every morning around 6:30 AM',
      });

      const cook = await Provider.create({
        name: 'Sunita (Cook)',
        category: 'Cook',
        billingType: 'monthly_fixed',
        defaultRate: 3500,
        unit: 'Month',
        phone: '+91 91234 56789',
        notes: 'Lunch and dinner preparation, arrives at 11:30 AM and 7:00 PM',
      });

      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentDay = Math.min(now.getDate(), 20);

      for (let day = 1; day <= currentDay; day++) {
        const dateStr = `${currentYearMonth}-${String(day).padStart(2, '0')}`;
        let qty = 1.5;
        let status = 'delivered';
        let notes = '';

        if (day === 5) {
          qty = 0;
          status = 'absent';
          notes = 'Went to village (no milk)';
        } else if (day === 7) {
          qty = 2.5;
          status = 'extra';
          notes = '1L extra for guest kheer';
        }

        const amt = status === 'absent' ? 0 : qty * 66;

        await DailyLog.create({
          provider: milkman._id,
          date: dateStr,
          quantity: qty,
          rate: 66,
          amount: amt,
          status,
          notes,
        });
      }

      await Payment.create({
        provider: milkman._id,
        date: `${currentYearMonth}-10`,
        amount: 500,
        paymentType: 'Advance',
        paymentMethod: 'UPI',
        notes: 'GPay advance for grocery shopping',
      });

      await Payment.create({
        provider: cook._id,
        date: `${currentYearMonth}-08`,
        amount: 1000,
        paymentType: 'Advance',
        paymentMethod: 'Cash',
        notes: 'Cash advance requested for festival clothes',
      });

      console.log('✅ Sample data seeded successfully!');
    }
  } catch (err) {
    console.warn('⚠️ Seeding note:', err.message);
  }
};

// Start Server
// const startServer = async () => {
//   await connectDB();
//   await autoSeedIfEmpty();

//   app.listen(PORT, () => {
//     console.log(`🚀 Household Billing Server running on http://localhost:${PORT}`);
//   });
// };

// startServer();

const startServer = async () => {
  await connectDB();
  await autoSeedIfEmpty();

  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(
        `🚀 Household Billing Server running on http://localhost:${PORT}`
      );
    });
  }
};

startServer();

export default app;
