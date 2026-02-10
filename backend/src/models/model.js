/**
 * UNIFIED MODEL INTERFACE
 * 
 * This file provides a unified interface for accessing models across:
 * - Primary Database: Customer, User (stored in main DB)
 * - Company Databases: All other models (stored in company-specific DBs)
 * 
 * Usage in controllers:
 * 
 * For Primary Models (Customer, User):
 *   const { Customer, User } = require("../models/model");
 *   const customer = await Customer.findOne({ uid: "123" });
 * 
 * For Company-Specific Models (Otp, Message, Token, etc.):
 *   const { getCompanyModels } = require("../models/model");
 *   const models = await getCompanyModels(companyId);
 *   const otp = await models.Otp.findOne({ uid: "123" });
 * 
 * Or use the middleware to automatically inject models:
 *   const { injectCompanyModels } = require("../models/model");
 *   router.get("/data", injectCompanyModels, async (req, res) => {
 *     const data = await req.models.Otp.find({});
 *   });
 */

const { getPrimaryDB } = require("../../config/dbConnectionManager");
const { CustomerSchema, UserSchema } = require("./primaryModels");
const {
  OtpSchema,
  MessageSchema,
  TokenSchema,
  CountSchema,
  LogSchema,
  emailTemplateSchema,
} = require("./companyModels");

// Cache for company-specific models
const companyModelsCache = new Map();

/**
 * Get Primary Database Models (Customer, User)
 * These are always available and stored in the primary database
 */
const getPrimaryModels = () => {
  const primaryDB = getPrimaryDB();
  
  return {
    Customer: primaryDB.model("customer", CustomerSchema),
    User: primaryDB.model("user", UserSchema),
  };
};

/**
 * Get Company-Specific Models
 * @param {mongoose.Connection} companyConnection - Company database connection
 * @returns {Object} - Object containing all company-specific models
 */
const getCompanyModelsFromConnection = (companyConnection) => {
  const connectionId = companyConnection.id;
  
  // Return cached models if available
  if (companyModelsCache.has(connectionId)) {
    return companyModelsCache.get(connectionId);
  }

  // Create models for this connection
  const models = {
    Otp: companyConnection.model("otp", OtpSchema),
    Message: companyConnection.model("message", MessageSchema),
    Token: companyConnection.model("token", TokenSchema),
    Counts: companyConnection.model("count", CountSchema),
    Logs: companyConnection.model("log", LogSchema),
    emailtemp: companyConnection.model("email_template", emailTemplateSchema),
  };

  // Cache the models
  companyModelsCache.set(connectionId, models);
  
  return models;
};

/**
 * Get Company-Specific Models by Company ID
 * @param {string} companyId - The company identifier
 * @returns {Promise<Object>} - Object containing all company-specific models
 */
const getCompanyModels = async (companyId) => {
  const { getCompanyDB } = require("../../config/dbConnectionManager");
  const companyConnection = await getCompanyDB(companyId);
  return getCompanyModelsFromConnection(companyConnection);
};

/**
 * Middleware to inject company models into request object
 * Requires companyId to be available in req.body, req.query, or req.params
 * 
 * Usage:
 *   router.get("/data", injectCompanyModels, async (req, res) => {
 *     const data = await req.models.Otp.find({});
 *   });
 */
const injectCompanyModels = async (req, res, next) => {
  try {
    // Try to get companyId from various sources
    const companyId = req.body.customer_id || 
                      req.query.customer_id || 
                      req.params.customer_id ||
                      req.body.company_id || 
                      req.query.company_id || 
                      req.params.company_id;

    if (!companyId) {
      return res.status(400).json({ 
        error: "Company ID is required (customer_id or company_id)" 
      });
    }

    // Get company-specific models
    req.models = await getCompanyModels(companyId);
    req.companyId = companyId;
    
    next();
  } catch (error) {
    console.error("Error injecting company models:", error);
    res.status(500).json({ 
      error: "Failed to initialize company database connection" 
    });
  }
};

// Initialize and export primary models
let Customer, User;
try {
  const primaryModels = getPrimaryModels();
  Customer = primaryModels.Customer;
  User = primaryModels.User;
} catch (error) {
  console.error("⚠️  Primary models not initialized. Call initializePrimaryDB first.");
}

module.exports = {
  // Primary Models (always available)
  Customer,
  User,
  
  // Functions to get company-specific models
  getCompanyModels,
  getCompanyModelsFromConnection,
  
  // Middleware
  injectCompanyModels,
  
  // For backward compatibility - these will be deprecated
  // Controllers should use getCompanyModels instead
  Otp: null,
  Message: null,
  Token: null,
  Counts: null,
  Logs: null,
  emailtemp: null,
};
