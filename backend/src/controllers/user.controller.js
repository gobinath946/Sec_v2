import { getMasterConnection, getCompanyConnection } from '../config/database.js';
import UserSchema from '../models/master/User.model.js';

export const listUsers = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    
    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const users = await User.find({ companyId, isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const { companyId, role: creatorRole } = req.user;

    // Validate role assignment permissions
    const roleHierarchy = {
      'company_super_admin_primary': ['company_super_admin_primary', 'company_super_admin', 'company_admin', 'user'],
      'company_super_admin': ['company_admin', 'user'],
      'company_admin': ['user']
    };

    if (!roleHierarchy[creatorRole]?.includes(role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign this role',
          timestamp: new Date().toISOString()
        }
      });
    }

    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    // Check if user already exists in company
    const existingUser = await User.findOne({ email: email.toLowerCase(), companyId });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists in your company',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create user in master database
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      companyId,
      role
    });
    await user.save();

    // TODO: Also create user record in company database

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role } = req.body;
    const { companyId, role: updaterRole } = req.user;

    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const user = await User.findOne({ _id: id, companyId });
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate role assignment if role is being changed
    if (role && role !== user.role) {
      const roleHierarchy = {
        'company_super_admin_primary': ['company_super_admin_primary', 'company_super_admin', 'company_admin', 'user'],
        'company_super_admin': ['company_admin', 'user'],
        'company_admin': ['user']
      };

      if (!roleHierarchy[updaterRole]?.includes(role)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to assign this role',
            timestamp: new Date().toISOString()
          }
        });
      }
      user.role = role;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    // TODO: Also update user in company database

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const masterConn = getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const user = await User.findOne({ _id: id, companyId });
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    // TODO: Also soft delete in company database

    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};
