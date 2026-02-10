const user = require("../models/model").User;
const Customer = require("../models/model").Customer;
const status_code = require("../Libs/constants");
const mongoose = require("mongoose");

const getCustomer = async (req, res) => {
    const uid = req.params.user_uid;
    if (!uid) {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "UID Is Required" });
    }
    try {
        const foundUser = await user.findOne({ user_uid: uid, is_deleted: false, is_active: true }, { _id: 0, password: 0 });
        if (foundUser) {
            const foundCustomer = await Customer.findOne({ uid: foundUser.user_uid }, { _id: 0, password: 0 });
            if (foundCustomer) {
                res.status(status_code.SUCCESS_STATUS).json({ customer: foundCustomer });
            } else {
                res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "Customer not found for the user" });
            }
        } else {
            res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: "Internal server error" });
    }
};

const getAllCustomer = async (req, res) => {
    const currentPage = req.params.currentPage || 1;
    const dataPerPage = 5;
    const { input } = req.query;
    const commonQuery = { is_active: true, is_deleted: false };
    const projection = { _id: 0, };

    if (input) {
        if (input.toLowerCase() !== "all") {
            if (input.includes("@")) { commonQuery.email_id = { $regex: new RegExp(input, "i") }; }
            else { commonQuery.user_name = { $regex: new RegExp(`^${input}`, "i") }; }
        }
    }
    commonQuery.company_level_permissions = { $ne: "superadmin" };
    try {
        const totalCustomers = await Customer.countDocuments(commonQuery);
        const totalPages = Math.ceil(totalCustomers / dataPerPage);
        const customers = await Customer
            .find(commonQuery, projection)
            .skip((currentPage - 1) * dataPerPage)
            .limit(dataPerPage)
            .sort({ created_at: -1 });

        res.status(status_code.SUCCESS_STATUS).json({
            customers,
            totalCustomers,
            totalPages,
        });
    } catch (error) {
        res
            .status(status_code.INTERNAL_SERVER_ERROR_STATUS)
            .json({ error: status_code.INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

const updateCustomer = async (req, res) => {
    const user_uid = req.params.user_uid;
    const { section, data } = req.body;

    if (!user_uid) {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "User Uid Is required" });
    }

    if (!section) {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "Section is required" });
    }

    const userRecord = await user.findOne({ user_uid: user_uid, is_active: true, is_deleted: false });
    if (!userRecord) {
        return res.status(status_code.USER_NOT_FOUND_STATUS).json({ message: status_code.USER_NOT_FOUND_MESSAGE });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let updateFields = {};

        if (section === 'emailConfig') {
            if (!data.email_configuration || !Array.isArray(data.email_configuration)) {
                return res.status(status_code.DATA_REQURIED_STATUS).json({ message: 'Invalid email configuration data' });
            }
            const updatedEmailConfig = data.email_configuration.map(config => {
                if (!config._id) {
                    config._id = new mongoose.Types.ObjectId();
                }
                return config;
            });
            updateFields = {
                email_configuration: updatedEmailConfig
            };
        }
        else if (section === 'smsConfig') {
            if (!data.sms_configuration || !Array.isArray(data.sms_configuration)) {
                return res.status(status_code.DATA_REQURIED_STATUS).json({ message: 'Invalid sms configuration data' });
            }
            const updatedSmsConfig = data.sms_configuration.map(config => {
                if (!config._id) {
                    config._id = new mongoose.Types.ObjectId();
                }
                return config;
            });
            updateFields = {
                sms_configuration: updatedSmsConfig
            };
        }
        else if (section === 'fileConfig') {
            if (!data.file_configuration || !Array.isArray(data.file_configuration)) {
                return res.status(status_code.DATA_REQURIED_STATUS).json({ message: 'Invalid file configuration data' });
            }
            const updatedfileConfig = data.file_configuration.map(config => {
                if (!config._id) {
                    config._id = new mongoose.Types.ObjectId();
                }
                return config;
            });
            updateFields = {
                file_configuration: updatedfileConfig
            };
        }
        else if (section === 'pageConfig') {
            if (!data || !data.payload) {
                return res.status(status_code.DATA_REQURIED_STATUS).json({ message: 'Payload is missing or invalid' });
            }
            const updatedPageConfigurations = data.payload.map(config => {
                const { _id, action, ...rest } = config;
                const filteredRest = Object.fromEntries(
                    Object.entries(rest).filter(([key, value]) => value !== undefined && value !== null && value !== "")
                );
                return {
                    _id,
                    action,
                    ...filteredRest
                };
            });
            updateFields = { page_configuration: updatedPageConfigurations };
        }
        else if (section === 'otpConfig') {
            updateFields = {
                otp_configuration: {
                    email_body: data.email_body,
                    email_subject: data.email_subject,
                    sms_body: data.sms_body
                }
            };
        }
        else if (section === 'otherConfig') {
            updateFields = {
                applnx_signature: data.applnx_signature,
                token: data.endpointtoken
            };
        }
        else {
            return res.status(status_code.DATA_REQURIED_STATUS).json({ message: 'Invalid section key' });
        }

        const updatedCustomer = await Customer.findOneAndUpdate({ uid: user_uid }, updateFields, { new: true }).session(session);

        if (section === 'personalData') {
            await user.findOneAndUpdate({ user_uid: user_uid }, { user_name: data.name, mobile_number: data.mobile }).session(session);
        }
        await session.commitTransaction();
        res.status(status_code.SUCCESS_STATUS).json({ data: "Customer Updated Successfully" });
    } catch (error) {
        console.error("Error updating customer data:", error);
        await session.abortTransaction();
        res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const getBrandingData = async (req, res) => {
    const uid = req.params.user_uid;
    if (!uid) {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "UID Is Required" });
    }
    try {
        const foundUser = await user.findOne({ user_uid: uid, is_deleted: false, is_active: true }, { _id: 0, password: 0 });
        if (foundUser) {
            const foundCustomer = await Customer.findOne({ uid: foundUser.user_uid }, 
                { _id: 0, password: 0, name: 0, email: 0, mobile: 0, created_at: 0, updated_at: 0 });
            if (foundCustomer) {
                res.status(status_code.SUCCESS_STATUS).json({ branding: foundCustomer.branding });
            } else {
                res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "Customer not found for the user" });
            }
        } else {
            res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: "Internal server error" });
    }
};

const updateBrandingData = async (req, res) => {
    const data = req.body;
    const uid = req.params.user_uid;

    if (!uid) {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "UID Is Required" });
    }
    try {
        const foundUser = await user.findOne({ user_uid: uid, is_deleted: false, is_active: true }, { _id: 0, password: 0 });
        if (!foundUser) {
            return res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "User not found" });
        }
        const foundCustomer = await Customer.findOne({ uid: foundUser.user_uid }, { password: 0, name: 0, email: 0,
             mobile: 0, created_at: 0, updated_at: 0 });
        if (!foundCustomer) {
            return res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "Customer not found for the user" });
        }
        const { objectName, updatedData } = data;
        if (!objectName || !updatedData || !updatedData.page_name) {
            return res.status(status_code.DATA_REQURIED_STATUS).json({ error: "Invalid data provided for update" });
        }
        const brandingArray = foundCustomer.branding[objectName];
        const index = brandingArray.findIndex(brand => brand.page_name === updatedData.page_name);
        if (index !== -1) {
            const updateObj = {};
            updateObj[`branding.${objectName}.${index}.styles`] = updatedData.styles;
            await Customer.updateOne({ uid: foundCustomer.uid }, { $set: updateObj });
            return res.status(status_code.SUCCESS_STATUS).json({ message: "Branding data updated successfully" });
        } else {
            return res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "Page name not found in branding data" });
        }
    } catch (error) {
        console.error(error);
        return res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: 'Internal server error' });
    }
};

const ManageTemplate = async (req, res) => {
    const { uid, page_name, new_page_name, actionType } = req.body;
  
    if (!uid || !actionType) {
      return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "UID and actionType are required" });
    }
  
    try {
      const foundUser = await user.findOne({ user_uid: uid, is_deleted: false, is_active: true }, { _id: 0, password: 0 });
      if (!foundUser) {
        return res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "User not found" });
      }
  
      const foundCustomer = await Customer.findOne({ uid: foundUser.user_uid }, { password: 0, name: 0, email: 0, mobile: 0, created_at: 0, updated_at: 0 });
      if (!foundCustomer) {
        return res.status(status_code.USER_NOT_FOUND_STATUS).json({ error: "Customer not found for the user" });
      }
  
      const templates = foundCustomer.branding.branding_template;
  
      if (actionType === 'add') {
        const existingTemplate = templates.find(template => template.page_name === page_name);
        if (existingTemplate) {
          return res.status(status_code.CONFLICT_STATUS).json({ message: "Template name already exists" });
        }
  
        const newTemplate = {
          page_name: page_name,
          _id: new mongoose.Types.ObjectId()
        };
  
        templates.push(newTemplate);
        await foundCustomer.save();
        return res.status(status_code.SUCCESS_STATUS).json({ success: true, message: "Template added successfully" });
  
      } else if (actionType === 'edit') {
        const existingTemplate = templates.find(template => template.page_name === new_page_name);
        if (existingTemplate) {
          return res.status(status_code.CONFLICT_STATUS).json({ message: "New template name already exists" });
        }
  
        const templateToEdit = templates.find(template => template.page_name === page_name);
        if (templateToEdit) {
          templateToEdit.page_name = new_page_name;
          await foundCustomer.save();
          return res.status(status_code.SUCCESS_STATUS).json({ success: true, message: "Template edited successfully" });
        } else {
          return res.status(status_code.USER_NOT_FOUND_STATUS).json({ message: "Template not found" });
        }
  
      } else if (actionType === 'delete') {
        const templateIndex = templates.findIndex(template => template.page_name === page_name);
        if (templateIndex !== -1) {
          templates.splice(templateIndex, 1);
          await foundCustomer.save();
          return res.status(status_code.SUCCESS_STATUS).json({ success: true, message: "Template deleted successfully" });
        } else {
          return res.status(status_code.USER_NOT_FOUND_STATUS).json({ message: "Template not found" });
        }
  
      } else {
        return res.status(status_code.DATA_REQURIED_STATUS).json({ message: "Invalid actionType" });
      }
    } catch (error) {
      console.error(error);
      return res.status(status_code.INTERNAL_SERVER_ERROR_STATUS).json({ error: 'Internal server error' });
    }
  };
  


module.exports = {
    getCustomer: getCustomer,
    updateCustomer: updateCustomer,
    getAllCustomer: getAllCustomer,
    getBrandingData: getBrandingData,
    updateBrandingData: updateBrandingData,
    ManageTemplate: ManageTemplate,
};
