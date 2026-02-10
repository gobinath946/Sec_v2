
const express = require('express');
const {
  getAllMbiOptions,
  getMbiOption,
  createMbiOption,
  updateMbiOption,
  deleteMbiOption,
  generateMbiOptionsSampleExcel,
  importMbiOptionsFromExcel,
  saveMbiOptionsImportedData
} = require('../controllers/mbiController');
const { verifyToken } = require('../controllers/authController');

const router = express.Router();

// MBI Options
router.get('/', getAllMbiOptions);
router.get('/:id', getMbiOption);
router.post('/', verifyToken, createMbiOption);
router.put('/:id', verifyToken, updateMbiOption);
router.delete('/:id', verifyToken, deleteMbiOption);

// Excel operations
router.get('/excel/template', verifyToken, generateMbiOptionsSampleExcel);
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
}, importMbiOptionsFromExcel);

router.post('/excel/save', verifyToken, saveMbiOptionsImportedData);

module.exports = router;
