/**
 * Database Helper Utilities
 * 
 * Provides convenient functions for controllers to access company-specific models
 */

const { getCompanyModels } = require("../models/model");
const { Customer, User } = require("../models/model");

/**
 * Extract company ID from request object
 * Looks in body, query, and params
 * @param {Object} req - Express request object
 * @returns {string|null} - Company ID or null if not found
 */
const extractCompanyId = (req) => {
  return (
    req.body.customer_id ||
    req.query.customer_id ||
    req.params.customer_id ||
    req.body.company_id ||
    req.query.company_id ||
    req.params.company_id ||
    req.body.uid ||
    req.query.uid ||
    req.params.uid
  );
};

/**
 * Get company models from request
 * Automatically extracts company ID and returns models
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Company-specific models
 * @throws {Error} - If company ID not found or connection fails
 */
const getModelsFromRequest = async (req) => {
  const companyId = extractCompanyId(req);
  
  if (!companyId) {
    throw new Error("Company ID not found in request");
  }
  
  return await getCompanyModels(companyId);
};

/**
 * Middleware to automatically inject company models into request
 * Usage: router.get("/data", injectModels, async (req, res) => { ... })
 */
const injectModels = async (req, res, next) => {
  try {
    const companyId = extractCompanyId(req);
    
    if (!companyId) {
      return res.status(400).json({
        error: "Company ID is required (customer_id, company_id, or uid)",
      });
    }
    
    req.models = await getCompanyModels(companyId);
    req.companyId = companyId;
    
    next();
  } catch (error) {
    console.error("Error injecting models:", error);
    res.status(500).json({
      error: "Failed to initialize company database connection",
    });
  }
};

/**
 * Get company info by user UID
 * @param {string} userUid - User unique identifier
 * @returns {Promise<Object>} - Customer object
 */
const getCompanyByUserUid = async (userUid) => {
  const user = await User.findOne({ 
    user_uid: userUid, 
    is_deleted: false, 
    is_active: true 
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  const customer = await Customer.findOne({ 
    uid: user.user_uid 
  });
  
  if (!customer) {
    throw new Error("Customer not found for user");
  }
  
  return customer;
};

module.exports = {
  extractCompanyId,
  getModelsFromRequest,
  injectModels,
  getCompanyByUserUid,
};
