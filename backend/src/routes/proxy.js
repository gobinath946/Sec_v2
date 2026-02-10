// routes/proxy.js
const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

// Insurance API proxy route
router.post('/proxy/insurance', proxyController.proxyInsurance);

// Auth API proxy route  
router.post('/proxy/auth', proxyController.proxyAuth);

router.post('/proxy/policy', proxyController.downloadAndUploadPolicyDocument);

module.exports = router;
