import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from './models/Provider.js';
import DailyLog from './models/DailyLog.js';
import Payment from './models/Payment.js';

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker');
    console.log('Connected to MongoDB for integration test');

    // Test query providers
    const providers = await Provider.find();
    console.log(`Found ${providers.length} providers`);

    // Test query logs
    const logs = await DailyLog.find();
    console.log(`Found ${logs.length} daily logs`);

    // Test query payments
    const payments = await Payment.find();
    console.log(`Found ${payments.length} payments`);

    console.log('All model queries passed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
