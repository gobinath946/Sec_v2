import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users
router.get('/', authorize('company_super_admin_primary', 'company_super_admin', 'company_admin'), listUsers);

// POST /api/users
router.post('/', authorize('company_super_admin_primary', 'company_super_admin', 'company_admin'), createUser);

// PUT /api/users/:id
router.put('/:id', authorize('company_super_admin_primary', 'company_super_admin', 'company_admin'), updateUser);

// DELETE /api/users/:id (soft delete)
router.delete('/:id', authorize('company_super_admin_primary', 'company_super_admin', 'company_admin'), deleteUser);

export default router;
