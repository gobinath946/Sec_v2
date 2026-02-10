import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getStats } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', getStats);

export default router;
