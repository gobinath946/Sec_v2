import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getSettings, updateSettings, testSettings } from '../controllers/settings.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('company_super_admin_primary', 'company_super_admin', 'company_admin'));

// GET /api/settings/:category
router.get('/:category', getSettings);

// PUT /api/settings/:category
router.put('/:category', updateSettings);

// POST /api/settings/:category/test
router.post('/:category/test', testSettings);

export default router;
