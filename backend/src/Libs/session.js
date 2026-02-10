const status_code = require("./constants");
const { User, Token } = require("../models/model");
const jwt = require("jsonwebtoken");

function sessionMiddleware(requiredRoles) {
  return async function (req, res, next) {
    const email_id = req.headers.email;
    const token = req.headers.token; 
    const missingFields = [];
    if (!email_id) missingFields.push("email_id");
    if (!token) missingFields.push("Token");

    if (missingFields.length > 0) {
      const errorMessage = `Required fields missing For Authorization: ${missingFields.join(', ')}`;
      return res.status(status_code.DATA_REQURIED_STATUS).json({ message: errorMessage });
    }

    try {
      const user = await User.findOne({ email_id, is_deleted: false, is_active: true, });
      if (!user) {
        return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: status_code.UNAUTHORIZED });
      }
      const userUid = user.user_uid;
      const tokenData = await Token.findOne({
        user_uid: userUid,
        is_active: true,
        is_deleted: false
      }).sort({ created_at: -1 }).limit(1);
      if (!tokenData) {
        return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: status_code.INVALID_TOKEN });
      }
      if (tokenData.user_uid !== userUid) {
        return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: "User Uid Missmatch" });
      }
      const { Token: encryptedToken } = tokenData;
      try {
        if (token !== encryptedToken) {
          return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: status_code.INVALID_TOKEN });
        }
        const decodedToken = jwt.verify(token, status_code.SECRET_KEY);

        if (!decodedToken) {
          return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: "Invalid Secret Key" });
        }

        if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
          await Token.updateMany(
            { user_uid: userUid, Token: encryptedToken },
            { $set: { is_deleted: true, is_active: false } }
          );
          return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: "Token Expired " });
        }
        const companyPermissions = decodedToken.companyPermissions;
        const companyPermissionsString = companyPermissions.join(',');
        const validRoles = requiredRoles.some(role => companyPermissionsString.includes(role));
        if (!validRoles) {
          return res.status(status_code.FORBIDDEN_STATUS).json({ error: status_code.INVALID_ROLE });
        }
        next();
      } catch (verifyError) {
        await Token.updateMany(
          { user_uid: userUid, Token: encryptedToken },
          { $set: { is_deleted: true, is_active: false } }
        );
        return res.status(status_code.UNAUTHORIZED_STATUS).json({ error: "Token Expired " });
      }
    } catch (error) {
      console.error("Error in sessionMiddleware:", error);
      return res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
    }
  };
}

module.exports = sessionMiddleware;