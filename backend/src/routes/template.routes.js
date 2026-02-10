import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { 
  listTemplates, 
  getTemplate, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  previewTemplate 
} from '../controllers/template.controller.js';

const router = express.Router();

router.use(authenticate);

// GET /api/templates
router.get('/', listTemplates);

// POST /api/templates
router.post('/', createTemplate);

// GET /api/templates/:id
router.get('/:id', getTemplate);

// PUT /api/templates/:id
router.put('/:id', updateTemplate);

// DELETE /api/templates/:id
router.delete('/:id', deleteTemplate);

// POST /api/templates/:id/preview
router.post('/:id/preview', previewTemplate);

export default router;
