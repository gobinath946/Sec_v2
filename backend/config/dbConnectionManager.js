const mongoose = require("mongoose");
const config = require("./environment/dbDependencies");

// Store active company database connections
const companyConnections = new Map();

// Primary database connection (for Customer and User models)
let primaryConnection = null;

/**
 * Initialize the primary database connection
 */
const initializePrimaryDB = async () => {
  if (primaryConnection && primaryConnection.readyState === 1) {
    return primaryConnection;
  }

  try {
    primaryConnection = await mongoose.createConnection(config.dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ Primary DB connected successfully");
    return primaryConnection;
  } catch (error) {
    console.error("❌ Primary DB connection error:", error);
    throw error;
  }
};

/**
 * Get or create a company-specific database connection
 * @param {string} companyId - The unique company identifier
 * @returns {mongoose.Connection} - Company-specific database connection
 */
const getCompanyDB = async (companyId) => {
  if (!companyId) {
    throw new Error("Company ID is required to get company database");
  }

  // Check if connection already exists and is active
  if (companyConnections.has(companyId)) {
    const existingConnection = companyConnections.get(companyId);
    if (existingConnection.readyState === 1) {
      return existingConnection;
    } else {
      // Remove stale connection
      companyConnections.delete(companyId);
    }
  }

  try {
    // Create company-specific database name
    // Use hash to keep name short (MongoDB has 38 byte limit)
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(companyId).digest('hex').substring(0, 8);
    const companyDbName = `cmp_${hash}`;
    
    // Parse the primary DB URL and replace the database name
    const dbUrlParts = config.dbURL.split("/");
    const baseUrl = dbUrlParts.slice(0, -1).join("/");
    const companyDbUrl = `${baseUrl}/${companyDbName}`;

    // Create new connection for company
    const companyConnection = await mongoose.createConnection(companyDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Store the connection with original companyId as key
    companyConnections.set(companyId, companyConnection);
    
    console.log(`✅ Company DB connected: ${companyDbName} (${companyId})`);
    return companyConnection;
  } catch (error) {
    console.error(`❌ Company DB connection error for ${companyId}:`, error);
    throw error;
  }
};

/**
 * Get the primary database connection
 * @returns {mongoose.Connection} - Primary database connection
 */
const getPrimaryDB = () => {
  if (!primaryConnection || primaryConnection.readyState !== 1) {
    throw new Error("Primary database not initialized. Call initializePrimaryDB first.");
  }
  return primaryConnection;
};

/**
 * Close a specific company database connection
 * @param {string} companyId - The company identifier
 */
const closeCompanyDB = async (companyId) => {
  if (companyConnections.has(companyId)) {
    const connection = companyConnections.get(companyId);
    await connection.close();
    companyConnections.delete(companyId);
    console.log(`🔒 Company DB closed for: ${companyId}`);
  }
};

/**
 * Close all database connections
 */
const closeAllConnections = async () => {
  // Close all company connections
  for (const [companyId, connection] of companyConnections.entries()) {
    await connection.close();
    console.log(`🔒 Company DB closed for: ${companyId}`);
  }
  companyConnections.clear();

  // Close primary connection
  if (primaryConnection) {
    await primaryConnection.close();
    console.log("🔒 Primary DB closed");
  }
};

/**
 * Get all active company connections count
 * @returns {number} - Number of active company connections
 */
const getActiveConnectionsCount = () => {
  return companyConnections.size;
};

module.exports = {
  initializePrimaryDB,
  getCompanyDB,
  getPrimaryDB,
  closeCompanyDB,
  closeAllConnections,
  getActiveConnectionsCount,
};
