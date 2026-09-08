import express from 'express';
import {
  getPayments,
  recordPayment,
  updatePayment,
  deletePayment,
} from '../controllers/paymentController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken to all payment routes
router.use(verifyToken);

router.route('/')
  .get(getPayments)
  .post(requireAdmin, recordPayment);

router.route('/:id')
  .put(requireAdmin, updatePayment)
  .delete(requireAdmin, deletePayment);

export default router;
