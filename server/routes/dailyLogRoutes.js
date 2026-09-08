import express from 'express';
import {
  getDailyLogs,
  upsertDailyLog,
  bulkUpsertDailyLogs,
  deleteDailyLog,
} from '../controllers/dailyLogController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken to all daily log routes
router.use(verifyToken);

router.route('/')
  .get(getDailyLogs)
  .post(requireAdmin, upsertDailyLog);

router.post('/bulk', requireAdmin, bulkUpsertDailyLogs);

router.route('/:id')
  .delete(requireAdmin, deleteDailyLog);

export default router;
