import jwt from 'jsonwebtoken';
import { getMasterConnection } from '../config/database.js';
import UserSchema from '../models/master/User.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive user',
          timestamp: new Date().toISOString()
        }
      });
    }

    req.user = {
      userId: user._id,
      companyId: user.companyId,
      role: user.role,
      email: user.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};
