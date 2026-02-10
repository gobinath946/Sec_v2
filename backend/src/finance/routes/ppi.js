
const express = require('express');
const {
  getAllPpiRates,
  getPpiRate,
  createPpiRate,
  updatePpiRate,
  deletePpiRate,
  generatePpiRatesSampleExcel,
  importPpiRatesFromExcel,
  savePpiRatesImportedData,
} = require('../controllers/ppiController');
const { verifyToken } = require('../controllers/authController');

const router = express.Router();

// PPI Rates
router.get('/rates', getAllPpiRates);
router.get('/rates/:id', getPpiRate);
router.post('/rates', verifyToken, createPpiRate);
router.put('/rates/:id', verifyToken, updatePpiRate);
router.delete('/rates/:id', verifyToken, deletePpiRate);

// PPI Rates Excel operations
router.get('/rates/excel/template', verifyToken, generatePpiRatesSampleExcel);
router.post('/rates/excel/import', verifyToken, (req, res, next) => {
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
}, importPpiRatesFromExcel);

router.post('/rates/excel/save', verifyToken, savePpiRatesImportedData);

module.exports = router;
