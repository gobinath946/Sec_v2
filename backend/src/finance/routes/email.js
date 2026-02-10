
const express = require('express');
const router = express.Router();

// Import the hubspot controller
const emailController = require('../controllers/emailController');

// Define routes for HubSpot API calls
router.post('/send-policy-email', emailController.SendEmail);

module.exports = router;
