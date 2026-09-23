import express from 'express';
import {
  getProviderMonthlySummary,
  getDashboardOverview,
  getCandidateMonthlyBill,
} from '../controllers/billingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/overview', getDashboardOverview);
router.get('/candidate-bill', getCandidateMonthlyBill);
router.get('/summary/:providerId', getProviderMonthlySummary);

export default router;
