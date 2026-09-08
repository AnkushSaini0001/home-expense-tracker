import express from 'express';
import {
  getProviderMonthlySummary,
  getDashboardOverview,
} from '../controllers/billingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken to all billing routes
router.use(verifyToken);

router.get('/overview', getDashboardOverview);
router.get('/summary/:providerId', getProviderMonthlySummary);

export default router;
