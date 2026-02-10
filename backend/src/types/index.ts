import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role: string;
    email: string;
  };
}

export type UserRole = 
  | 'company_super_admin_primary' 
  | 'company_super_admin' 
  | 'company_admin' 
  | 'user';

export type PlatformRole = 'platform_admin';

export interface JWTPayload {
  userId: string;
  companyId: string;
  role: UserRole | PlatformRole;
  email: string;
}
