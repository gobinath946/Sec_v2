/**
 * COMPANY DATABASE MIDDLEWARE
 * 
 * This middleware dynamically connects to company-specific databases
 * based on the authenticated user's company information.
 * 
 * It injects company-specific models into req.models for use in controllers.
 */

const { getCompanyDB } = require("../../config/dbConnectionManager");
const { getCompanyModelsFromConnection } = require("../models/model");
const jwt = require("jsonwebtoken");
const status_code = require("../Libs/constants");
const { User } = require("../models/model");

/**
 * Middleware to inject company database connection and models
 * Extracts user info from JWT token and connects to their company database
 */
const companyDbMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Authorization token required" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, status_code.SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ 
        error: "Invalid or expired token" 
      });
    }

    // Get user information from database
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active || user.is_deleted) {
      return res.status(401).json({ 
        error: "User not found or inactive" 
      });
    }

    // Get company database connection using user_uid as company identifier
    const companyConnection = await getCompanyDB(user.user_uid);
    
    // Get company-specific models
    const companyModels = getCompanyModelsFromConnection(companyConnection);

    // Inject into request object
    req.companyDb = companyConnection;
    req.models = companyModels;
    req.user = user;
    req.companyId = user.user_uid;

    next();
  } catch (error) {
    console.error("Company DB Middleware Error:", error);
    res.status(500).json({ 
      error: "Failed to connect to company database",
      details: error.message 
    });
  }
};

/**
 * Optional middleware for routes that may or may not need company DB
 * Does not fail if company DB cannot be connected
 */
const optionalCompanyDbMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      try {
        const decoded = jwt.verify(token, status_code.SECRET_KEY);
        const user = await User.findById(decoded.userId);
        
        if (user && user.is_active && !user.is_deleted) {
          const companyConnection = await getCompanyDB(user.user_uid);
          const companyModels = getCompanyModelsFromConnection(companyConnection);
          
          req.companyDb = companyConnection;
          req.models = companyModels;
          req.user = user;
          req.companyId = user.user_uid;
        }
      } catch (error) {
        // Silently fail - this is optional
        console.log("Optional company DB middleware: Could not connect", error.message);
      }
    }
    
    next();
  } catch (error) {
    // Continue without company DB
    next();
  }
};

module.exports = {
  companyDbMiddleware,
  optionalCompanyDbMiddleware,
};
