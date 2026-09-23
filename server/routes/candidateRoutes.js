import express from 'express';
import {
  getCandidates,
  getCandidateById,
} from '../controllers/candidateController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);

export default router;
