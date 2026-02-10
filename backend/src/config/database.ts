import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Master database connection
let masterConnection: Connection | null = null;

// Company database connections cache
const companyConnections = new Map<string, Connection>();

/**
 * Initialize master database connection
 */
export const connectMasterDB = async (): Promise<Connection> => {
  if (masterConnection && masterConnection.readyState === 1) {
    return masterConnection;
  }

  const masterDbUri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/secure_gateway_master';

  try {
    masterConnection = await mongoose.createConnection(masterDbUri).asPromise();
    console.log('Master database connected successfully');
    return masterConnection;
  } catch (error) {
    console.error('Master database connection error:', error);
    throw error;
  }
};

/**
 * Get or create company-specific database connection
 * @param companyId - The company ID
 * @returns Company database connection
 */
export const getCompanyConnection = async (companyId: string): Promise<Connection> => {
  // Check if connection already exists and is active
  if (companyConnections.has(companyId)) {
    const connection = companyConnections.get(companyId)!;
    if (connection.readyState === 1) {
      return connection;
    }
    // Remove stale connection
    companyConnections.delete(companyId);
  }

  const baseUri = process.env.COMPANY_DB_BASE_URI || 'mongodb://localhost:27017';
  const companyDbUri = `${baseUri}/company_${companyId}`;

  try {
    const connection = await mongoose.createConnection(companyDbUri).asPromise();
    companyConnections.set(companyId, connection);
    console.log(`Company database connected: company_${companyId}`);
    return connection;
  } catch (error) {
    console.error(`Company database connection error for ${companyId}:`, error);
    throw error;
  }
};

/**
 * Close all database connections
 */
export const closeAllConnections = async (): Promise<void> => {
  try {
    // Close master connection
    if (masterConnection) {
      await masterConnection.close();
      masterConnection = null;
    }

    // Close all company connections
    for (const [companyId, connection] of companyConnections.entries()) {
      await connection.close();
      companyConnections.delete(companyId);
    }

    console.log('All database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
};

/**
 * Get master database connection
 */
export const getMasterConnection = (): Connection => {
  if (!masterConnection || masterConnection.readyState !== 1) {
    throw new Error('Master database not connected');
  }
  return masterConnection;
};

/**
 * Health check for database connections
 */
export const checkDatabaseHealth = async (): Promise<{
  master: boolean;
  companies: number;
}> => {
  const masterHealthy = masterConnection?.readyState === 1;
  const activeCompanyConnections = Array.from(companyConnections.values()).filter(
    (conn) => conn.readyState === 1
  ).length;

  return {
    master: masterHealthy,
    companies: activeCompanyConnections,
  };
};
