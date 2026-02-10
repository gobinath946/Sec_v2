const user = require("../models/model").User;
const Customer = require("../models/model").Customer;
const TokenModel = require("../models/model").Token;
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const status_code = require("../Libs/constants");
const jwt = require("jsonwebtoken");

const createuser = async (req, res) => {
  const userData = req.body;
  const requiredFields = [
    "email_id",
    "user_name",
    "password",
    "company_level_permissions",
    "company_name",
    "mobile_number",
  ];
  const missingFields = requiredFields.filter((field) => {
    if (Array.isArray(userData[field])) {
      if (userData[field].length === 0) {
        return userData[field];
      }
    } else {
      return !userData[field];
    }
  });
  if (missingFields.length > 0) {
    const errorMessage = `Required fields missing: ${missingFields.join(", ")}`;
    return res
      .status(status_code.DATA_REQURIED_STATUS)
      .json({ message: errorMessage });
  }

  if (
    Array.isArray(userData.company_level_permissions) &&
    userData.company_level_permissions.includes("superadmin")
  ) {
    return res
      .status(status_code.FORBIDDEN_STATUS)
      .json({ message: "Invalid company permission. Superadmin not allowed." });
  } else if (
    !Array.isArray(userData.company_level_permissions) ||
    !userData.company_level_permissions.includes("admin")
  ) {
    return res.status(status_code.FORBIDDEN_STATUS).json({
      message: "Invalid company permission. Admin permission required.",
    });
  }

  try {
    const existingUser = await user.findOne({
      $or: [{ email_id: userData.email_id }, { user_name: userData.user_name }],
    });
    if (existingUser) {
      if (existingUser.email_id === userData.email_id) {
        return res
          .status(status_code.DATA_DUPLICATE_STATUS)
          .json({ message: status_code.Email_ID_DUPLICATE });
      }
      if (existingUser.user_name === userData.user_name) {
        return res
          .status(status_code.DATA_DUPLICATE_STATUS)
          .json({ message: status_code.User_NAME_DUPLICATE });
      }
    }
    const hashedPassword = await bcryptjs.hash(
      userData.password,
      status_code.HASH_ROUNDS
    );
    userData.password = hashedPassword;
    uid = crypto.randomBytes(16).toString("hex");
    const existing_user_uid = await user.findOne({ user_uid: uid });
    if (existing_user_uid) {
      return res
        .status(status_code.DATA_DUPLICATE_STATUS)
        .json({ message: status_code.USER_UID_DUPLICATE });
    } else {
      userData.user_uid = uid;
    }
    const newUser = new user(userData);
    await newUser.save();

    const customerData = {
      uid: newUser.user_uid,
      name: newUser.user_name,
      email: newUser.email_id,
      mobile: newUser.mobile_number,
      is_active: true,
      is_deleted: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const newCustomer = new Customer(customerData);
    await newCustomer.save();
    res
      .status(status_code.SUCCESS_STATUS)
      .json({ message: status_code.USER_CREATED_SUCESS });
  } catch (error) {
    console.log(error);
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ message: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const Login = async (req, res) => {
  let { email_id, password } = req.body;
  const requiredFields = ["email_id", "password"];
  const missingFields = requiredFields.filter((field) => {
    if (Array.isArray(req.body[field])) {
      if (req.body[field].length === 0) {
        return req.body[field];
      }
    } else {
      return !req.body[field];
    }
  });
  if (missingFields.length > 0) {
    const errorMessage = `Required fields missing: ${missingFields.join(", ")}`;
    return res
      .status(status_code.DATA_REQURIED_STATUS)
      .json({ message: errorMessage });
  }
  try {
    const users = await user.findOne({
      email_id,
      is_deleted: false,
      is_active: true,
    });
    if (!users) {
      return res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ message: status_code.USER_NOT_FOUND_MESSAGE });
    }
    const isPasswordValid = await bcryptjs.compare(password, users.password);
    if (!isPasswordValid) {
      return res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ message: status_code.INVALID_PASSWORD });
    }
    const secretKey = status_code.SECRET_KEY;
    const tokenUid = crypto.randomBytes(16).toString("hex");
    const token = jwt.sign(
      {
        userId: users._id,
        companyPermissions: users.company_level_permissions,
      },
      secretKey,
      { expiresIn: "8h" }
    );
    await TokenModel.create({
      user_uid: users.user_uid,
      token_uid: tokenUid,
      Token: token,
    });
    await users.save();
    return res.status(status_code.SUCCESS_STATUS).json({
      token,
      companyPermissions: users.company_level_permissions,
      email_id: users.email_id,
      userName: users.user_name,
      user_uid: users.user_uid,
    });
  } catch (err) {
    console.log(err);
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ message: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const logout = async (req, res) => {
  const email_id = req.params.email_id;
  const requiredFields = ["email_id"];
  const missingFields = requiredFields.filter((field) => {
    return !req.params[field];
  });

  if (missingFields.length > 0) {
    const errorMessage = `Required fields missing: ${missingFields.join(", ")}`;
    return res
      .status(status_code.DATA_REQURIED_STATUS)
      .json({ message: errorMessage });
  }

  try {
    const users = await user.findOne({
      email_id,
      is_active: true,
      is_deleted: false,
    });
    if (!users) {
      return res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ message: status_code.USER_NOT_FOUND_MESSAGE });
    }
    const latestToken = await TokenModel.findOne({
      user_uid: users.user_uid,
      is_active: true,
      is_deleted: false,
    })
      .sort({ created_at: -1 })
      .limit(1);
    if (!latestToken) {
      return res
        .status(status_code.UNAUTHORIZED_STATUS)
        .json({ error: status_code.INVALID_TOKEN });
    }
    await TokenModel.updateOne(
      { _id: latestToken._id },
      { $set: { is_deleted: true, is_active: false } }
    );
    res
      .status(status_code.SUCCESS_STATUS)
      .json({ message: "Logged Out Successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ message: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const getUser = async (req, res) => {
  const uid = req.params.user_uid;
  if (!uid) {
    return res
      .status(status_code.DATA_REQURIED_STATUS)
      .json({ message: "UID Is Required" });
  }
  try {
    const users = await user.findOne(
      { user_uid: uid, is_deleted: false, is_active: true },
      { _id: 0, token: 0, password: 0 }
    );
    if (users) {
      res.status(status_code.SUCCESS_STATUS).json(users);
    } else {
      res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ error: status_code.USER_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const getAllUser = async (req, res) => {
  const currentPage = req.params.currentPage || 1;
  const dataPerPage = 5;
  const { input } = req.query;
  const commonQuery = { is_active: true, is_deleted: false };
  const projection = { _id: 0, token: 0, password: 0 };

  if (input) {
    if (input.toLowerCase() !== "all") {
      if (input.includes("@")) {
        commonQuery.email_id = { $regex: new RegExp(input, "i") };
      } else {
        commonQuery.user_name = { $regex: new RegExp(`^${input}`, "i") };
      }
    }
  }
  commonQuery.company_level_permissions = { $ne: "superadmin" };
  try {
    const totalUsers = await user.countDocuments(commonQuery);
    const totalPages = Math.ceil(totalUsers / dataPerPage);
    const users = await user
      .find(commonQuery, projection)
      .skip((currentPage - 1) * dataPerPage)
      .limit(dataPerPage)
      .sort({ created_at: -1 });

    res.status(status_code.SUCCESS_STATUS).json({
      users,
      totalUsers,
      totalPages,
    });
  } catch (error) {
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const updateUser = async (req, res) => {
  const uid = req.params.user_uid;
  const userData = req.body;
  const requiredFields = [
    "email_id",
    "user_name",
    "mobile_number",
    "company_name",
  ];
  const missingFields = requiredFields.filter((field) => !(field in userData));

  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }

  if (missingFields.length > 0) {
    const errorMessage = `Required fields missing: ${missingFields.join(", ")}`;
    return res
      .status(status_code.DATA_REQURIED_STATUS)
      .json({ message: errorMessage });
  }

  try {
    const existingUser = await user.findOne({
      user_uid: uid,
      is_active: true,
      is_deleted: false,
    });
    if (existingUser) {
      const updateData = {};
      const customerData = {};
      Object.keys(userData).forEach((field) => {
        if (requiredFields.includes(field)) {
          updateData[field] = userData[field];
          if (field === "email_id") {
            customerData.email = userData[field];
          } else if (field === "user_name") {
            customerData.name = userData[field];
          } else if (field === "mobile_number") {
            customerData.mobile = userData[field];
          }
        }
      });

      if (
        Array.isArray(userData.company_level_permissions) &&
        userData.company_level_permissions.includes("superadmin")
      ) {
        return res
          .status(status_code.FORBIDDEN_STATUS)
          .json({ message: "Super Admin Values Cannot Be Changed." });
      } else if (
        !Array.isArray(userData.company_level_permissions) ||
        !userData.company_level_permissions.includes("admin")
      ) {
        return res.status(status_code.FORBIDDEN_STATUS).json({
          message: "Invalid company permission. Admin permission required.",
        });
      }

      if (userData.password) {
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        updateData.password = hashedPassword;
      }
      if (userData.company_level_permissions) {
        updateData.company_level_permissions =
          userData.company_level_permissions;
      }
      const updatedUser = await user.findOneAndUpdate(
        { user_uid: uid, is_active: true, is_deleted: false },
        updateData,
        { new: true, projection: { _id: 0, token: 0 } }
      );
      if (updatedUser) {
        await Customer.updateOne(
          { uid: uid, is_active: true, is_deleted: false },
          { $set: customerData }
        );
        res
          .status(status_code.SUCCESS_STATUS)
          .json({ message: "User Updated Successfully" });
      }
    } else {
      res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ error: status_code.USER_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const deleteUser = async (req, res) => {
  const uid = req.params.user_uid;
  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }
  try {
    const deletedUser = await user.updateOne(
      { user_uid: uid, is_active: true, is_deleted: false },
      { $set: { is_deleted: true } }
    );
    if (deletedUser) {
      await Customer.deleteMany({ uid: uid });
      res
        .status(status_code.SUCCESS_STATUS)
        .json({ message: "User Deleted Successfully" });
    } else {
      res
        .status(status_code.USER_NOT_FOUND_STATUS)
        .json({ error: status_code.USER_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res
      .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
      .json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const getJwtToken = async (req, res) => {
  try {
    const { secret_key } = req.query;
    if (!secret_key) {
      return res.status(400).json({
        error: "secret_key required",
      });
    }
    const secretKey = status_code.SECRET_KEY;
    const token = jwt.sign(
      {
        secret_key: secret_key,
        timestamp: Date.now(),
      },
      secretKey,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createuser: createuser,
  Login: Login,
  logout: logout,
  getUser: getUser,
  getAllUser: getAllUser,
  updateUser: updateUser,
  deleteUser: deleteUser,
  getJwtToken: getJwtToken,
};
