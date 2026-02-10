import express from 'express';

const router = express.Router();

// GET /api/documents/:sessionId
router.get('/:sessionId', async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/:sessionId/sign
router.post('/:sessionId/sign', async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/:sessionId/verify-mfa
router.post('/:sessionId/verify-mfa', async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    next(error);
  }
});

export default router;
