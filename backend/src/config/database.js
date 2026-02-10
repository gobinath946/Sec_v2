import mongoose from 'mongoose';

let masterConnection = null;
const companyConnections = new Map();

export const connectMasterDB = async () => {
  try {
    const uri = process.env.MASTER_DB_URI;
    masterConnection = await mongoose.createConnection(uri).asPromise();
    console.log('Master database connected');
    return masterConnection;
  } catch (error) {
    console.error('Master DB connection error:', error);
    throw error;
  }
};

export const getMasterConnection = () => {
  if (!masterConnection) {
    throw new Error('Master database not connected');
  }
  return masterConnection;
};

export const getCompanyConnection = async (companyId) => {
  if (!companyConnections.has(companyId)) {
    const uri = `${process.env.DB_BASE_URI}/company_${companyId}`;
    const connection = await mongoose.createConnection(uri).asPromise();
    companyConnections.set(companyId, connection);
    console.log(`Company database connected: company_${companyId}`);
  }
  return companyConnections.get(companyId);
};

export const closeAllConnections = async () => {
  if (masterConnection) {
    await masterConnection.close();
  }
  for (const [companyId, connection] of companyConnections) {
    await connection.close();
  }
  companyConnections.clear();
};
