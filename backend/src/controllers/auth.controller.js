import jwt from 'jsonwebtoken';
import { getMasterConnection, getCompanyConnection } from '../config/database.js';
import UserSchema from '../models/master/User.model.js';
import CompanySchema from '../models/master/Company.model.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const Company = masterConn.model('Company', CompanySchema);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create company
    const company = new Company({
      name: companyName,
      databaseName: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await company.save();

    // Create company database
    await getCompanyConnection(company._id);

    // Create user with Company_Super_Admin_Primary role
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      companyId: company._id,
      role: 'company_super_admin_primary'
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, companyId: company._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company._id,
        companyName: company.name
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const Company = masterConn.model('Company', CompanySchema);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get company details
    const company = await Company.findById(user.companyId);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, companyId: user.companyId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company._id,
        companyName: company.name
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const Company = masterConn.model('Company', CompanySchema);

    const user = await User.findById(req.user.userId).select('-password');
    const company = await Company.findById(user.companyId);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company._id,
        companyName: company.name
      }
    });
  } catch (error) {
    next(error);
  }
};
