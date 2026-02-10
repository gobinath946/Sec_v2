/**
 * COMPANY DATABASE INITIALIZER
 * 
 * Utilities to initialize a new company database with all necessary
 * collections and default data when a new company registers.
 */

const { getCompanyDB } = require("../../config/dbConnectionManager");
const { getCompanyModelsFromConnection } = require("../models/model");

/**
 * Initialize a new company database with all necessary collections
 * @param {string} companyId - The unique company identifier (user_uid)
 * @returns {Promise<Object>} - Object containing connection and models
 */
const initializeCompanyDatabase = async (companyId) => {
  try {
    console.log(`🔧 Initializing company database for: ${companyId}`);
    
    // Get or create company database connection
    const companyConnection = await getCompanyDB(companyId);
    
    // Get all company-specific models (this will create collections)
    const models = getCompanyModelsFromConnection(companyConnection);
    
    // Create indexes for better performance
    await createCompanyIndexes(models);
    
    // Initialize default data if needed
    await initializeDefaultData(models, companyId);
    
    console.log(`✅ Company database initialized successfully for: ${companyId}`);
    
    return {
      connection: companyConnection,
      models: models,
      dbName: companyConnection.name,
    };
  } catch (error) {
    console.error(`❌ Failed to initialize company database for ${companyId}:`, error);
    throw error;
  }
};

/**
 * Create indexes for company collections
 * @param {Object} models - Company-specific models
 */
const createCompanyIndexes = async (models) => {
  try {
    // OTP indexes
    await models.Otp.collection.createIndex({ uid: 1 });
    await models.Otp.collection.createIndex({ mobile_number: 1 });
    await models.Otp.collection.createIndex({ email: 1 });
    await models.Otp.collection.createIndex({ created_at: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes
    
    // Token indexes
    await models.Token.collection.createIndex({ user_uid: 1 });
    await models.Token.collection.createIndex({ token_uid: 1 }, { unique: true });
    await models.Token.collection.createIndex({ is_active: 1, is_deleted: 1 });
    
    // Message indexes
    await models.Message.collection.createIndex({ created_at: -1 });
    
    // Counts indexes
    await models.Counts.collection.createIndex({ customer_id: 1 });
    
    // Logs indexes
    await models.Logs.collection.createIndex({ email: 1 });
    await models.Logs.collection.createIndex({ message_id: 1 });
    await models.Logs.collection.createIndex({ created_at: -1 });
    
    // Email template indexes
    await models.emailtemp.collection.createIndex({ temp_id: 1 });
    await models.emailtemp.collection.createIndex({ user_uid: 1 });
    
    console.log("✅ Company database indexes created");
  } catch (error) {
    console.error("⚠️  Error creating indexes:", error.message);
    // Don't throw - indexes are optional for functionality
  }
};

/**
 * Initialize default data for a new company
 * @param {Object} models - Company-specific models
 * @param {string} companyId - The company identifier
 */
const initializeDefaultData = async (models, companyId) => {
  try {
    // Initialize counts document for the company
    const existingCount = await models.Counts.findOne({ customer_id: companyId });
    if (!existingCount) {
      await models.Counts.create({
        customer_id: companyId,
        sms_counts: [],
        email_counts: [],
        credit_counts: [],
        purchased_counts: [],
        is_active: true,
        is_deleted: false,
      });
      console.log("✅ Default counts document created");
    }
    
    // Add any other default data initialization here
    // For example: default email templates, default settings, etc.
    
  } catch (error) {
    console.error("⚠️  Error initializing default data:", error.message);
    // Don't throw - default data is optional
  }
};

/**
 * Verify company database is properly initialized
 * @param {string} companyId - The company identifier
 * @returns {Promise<boolean>} - True if database is properly initialized
 */
const verifyCompanyDatabase = async (companyId) => {
  try {
    const companyConnection = await getCompanyDB(companyId);
    const models = getCompanyModelsFromConnection(companyConnection);
    
    // Check if collections exist
    const collections = await companyConnection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['otps', 'messages', 'tokens', 'counts', 'logs', 'email_templates'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    
    if (missingCollections.length > 0) {
      console.log(`⚠️  Missing collections for ${companyId}:`, missingCollections);
      return false;
    }
    
    console.log(`✅ Company database verified for: ${companyId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error verifying company database for ${companyId}:`, error);
    return false;
  }
};

module.exports = {
  initializeCompanyDatabase,
  createCompanyIndexes,
  initializeDefaultData,
  verifyCompanyDatabase,
};
