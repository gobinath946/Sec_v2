const Otp = require("../models/model").Otp;
const Customer = require('../models/model').Customer;
const user = require('../models/model').User;
const crypto = require("crypto");
const sendSMS = require('../Libs/clicksendsms');
const sendEmail = require('../Libs/sendemail')
const lib_data = require("../Libs/constants");
const bcryptjs = require("bcryptjs");


const generateCryptoOTP = (rounds = 1) => {
    const randomString = Math.random().toString(36).substring(2);
    let otpHash = randomString;
    for (let i = 0; i < rounds; i++) {
        const hash = crypto.createHash('sha256');
        hash.update(otpHash);
        otpHash = hash.digest('hex');
    }
    const otpNumber = parseInt(otpHash.substring(0, 6), 16);
    const otp = otpNumber % 1000000;
    return otp.toString().padStart(6, '0');
};

const sendOTP = async (mobileNumber, email) => {
    const otp = generateCryptoOTP(100);
    try {
        let smsSent = false;
        let emailSent = false;

        if (mobileNumber) {
            const messageBodySMS = `Your OTP for verification is ${otp}.`;
            const smsResponse = await sendSMS(lib_data.FORGETSMS_SERVICE_NAME,lib_data.FORGETSMS_USERNAME, lib_data.FORGETSMS_TOKEN, messageBodySMS, mobileNumber,lib_data.FORGETSMS_SENDER_ID);
            if (smsResponse.response_code === 'SUCCESS') {
                smsSent = true;
            }
        }

        if (email) {
            const email_body = `Your OTP for verification is ${otp}.`;
            const subject = "Verification OTP";
            const emailResponse = await sendEmail(lib_data.FORGETEMAIL_SERVICE_NAME,lib_data.FORGETEMAIL_USERNAME, lib_data.FORGETEMAIL_TOKEN, email, subject, email_body);
            if (emailResponse) {
                emailSent = true;
            }
        }
        await saveOTP(mobileNumber, otp, email);
        return { smsSent, emailSent };
    } catch (error) {
        console.error("Error sending OTP:", error);
        return { smsSent: false, emailSent: false };
    }
};

const verifyEmail = async (req, res) => {
    const { email_id } = req.body;
    if (!email_id) {
        return res.status(400).json({ error: "Email ID is required" });
    }
    try {
        const existingCustomer = await Customer.findOne({ email: email_id });
        if (!existingCustomer) {
            return res.status(400).json({ error: "Customer not found with the provided email ID" });
        }
        const { mobile, email } = existingCustomer;
        const { smsSent, emailSent } = await sendOTP(mobile, email);
        if (smsSent || emailSent) {
            return res.status(200).json({ message: "OTP sent successfully" });
        } else {
            return res.status(500).json({ error: "Failed to send OTP" });
        }
    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


const saveOTP = async (mobileNumber, otp, email) => {
    const Uid = crypto.randomBytes(16).toString("hex");
    const newOtp = new Otp({
        uid: Uid,
        mobile_number: mobileNumber,
        email: email,
        otp,
        is_active: true
    });
    try {
        await newOtp.save();
    } catch (error) {
        console.error(`Error saving OTP for`);
    }
};




const verifyOTP = async (req, res) => {
    const { email_id, otp } = req.body;
    try {
        if (!email_id) {
            return res.status(400).json({ error: "Email is required" });
        }
        if (!otp) {
            return res.status(400).json({ error: "verification code is required" });
        }
        const latestOTP = await Otp.findOne({ email: email_id, otp: otp, is_active: true }).sort({ created_at: -1 });
        if (latestOTP) {
            return res.status(200).json({ message: "OTP Verified Successfully" });
        } else {
            return res.status(400).json({ error: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ error: `Error verifying OTP for ${email}` });
    }
};



const updatePass = async (req, res) => {
    const { email_id, newPassword } = req.body;

    if (!email_id) {
        return res.status(400).json({ error: "Email is required" });
    }

    if (!newPassword) {
        return res.status(400).json({ error: "Password is required" });
    }

    try {
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        const updatedUser = await user.findOneAndUpdate(
            { email_id, is_active: true, is_deleted: false },
            { password: hashedPassword },
            { new: true, projection: { _id: 0, token: 0 } }
        );

        if (updatedUser) {
            return res.status(lib_data.SUCCESS_STATUS).json({ message: "User Updated Successfully" });
        } else {
            return res.status(lib_data.USER_NOT_FOUND_STATUS).json({ error: lib_data.USER_NOT_FOUND_MESSAGE });
        }
    } catch (error) {
        return res.status(lib_data.INTERNAL_SERVER_ERROR_STATUS).json({ error: lib_data.INTERNAL_SERVER_ERROR_MESSAGE });
    }
};



module.exports = {
    verifyEmail: verifyEmail,
    verifyOTP: verifyOTP,
    updatePass: updatePass,
};
