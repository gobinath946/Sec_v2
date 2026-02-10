
const express = require('express');
const router = express.Router();

// Import the hubspot controller
const hubspotController = require('../controllers/hubspotController');
const autoSureController = require('../controllers/AutosureUserController');

// Define routes for HubSpot API calls
router.post('/get-finance-details', hubspotController.getFinanceDetails);
router.post('/clear_signature/:deal_id', hubspotController.clearSignature);
router.post('/update-finance-details', hubspotController.updateFinanceDetails);
router.post('/verify-user', autoSureController.verifyUser);

module.exports = router;
