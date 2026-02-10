
const User = require('../models/AutosureUser'); // Adjust the path as necessary

const userController = {
  // Verify user by email and return user data with dealerships
  async verifyUser(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('email name userCode dealerships role');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          email: user.email,
          name: user.name,
          role:user.role,
          userCode: user.userCode,
          dealerships: user.dealerships
        }
      });

    } catch (error) {
      console.error('Error verifying user:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController;
