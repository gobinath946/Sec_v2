import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  masterDbUri: string;
  companyDbBaseUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  frontendUrl: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    masterDbUri: process.env.MASTER_DB_URI || 'mongodb://localhost:27017/secure_gateway_master',
    companyDbBaseUri: process.env.COMPANY_DB_BASE_URI || 'mongodb://localhost:27017',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
};

export const config = getEnvironmentConfig();

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
