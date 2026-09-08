import express from 'express';
import {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
} from '../controllers/providerController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken to all provider routes
router.use(verifyToken);

router.route('/')
  .get(getProviders)
  .post(requireAdmin, createProvider);

router.route('/:id')
  .get(getProviderById)
  .put(requireAdmin, updateProvider)
  .delete(requireAdmin, deleteProvider);

export default router;
