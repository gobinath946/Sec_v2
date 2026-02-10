
const express = require('express');
const {
  getAllGapOptions,
  getGapOption,
  createGapOption,
  updateGapOption,
  deleteGapOption,
  generateSampleExcel,
  importFromExcel,
  saveImportedData
} = require('../controllers/gapController');
const { verifyToken } = require('../controllers/authController');

const router = express.Router();

// Public routes (read-only)
router.get('/', getAllGapOptions);
router.get('/:id', getGapOption);

// Protected routes (require authentication)
router.post('/', verifyToken, createGapOption);
router.put('/:id', verifyToken, updateGapOption);
router.delete('/:id', verifyToken, deleteGapOption);

// Excel operations
router.get('/excel/template', verifyToken, generateSampleExcel);
router.post('/excel/import', verifyToken, (req, res, next) => {
  req.upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
}, importFromExcel);

router.post('/excel/save', verifyToken, saveImportedData);

module.exports = router;
