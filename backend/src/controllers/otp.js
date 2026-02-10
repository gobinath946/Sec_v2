const Otp = require("../models/model").Otp;
const Customer = require("../models/model").Customer;
const crypto = require("crypto");
const sendSMS = require("../Libs/clicksendsms");
const sendEmail = require("../Libs/sendemail");

const generateCryptoOTP = (rounds = 1) => {
  const randomString = Math.random().toString(36).substring(2);
  let otpHash = randomString;
  for (let i = 0; i < rounds; i++) {
    const hash = crypto.createHash("sha256");
    hash.update(otpHash);
    otpHash = hash.digest("hex");
  }
  const otpNumber = parseInt(otpHash.substring(0, 6), 16);
  const otp = otpNumber % 1000000;
  return otp.toString().padStart(6, "0");
};

const sendOTP = async (req, res) => {
  const { mobileNumber, customer_id, email, source } = req.body;
  let sms_token,
    sms_name,
    email_token,
    email_name,
    email_service,
    sms_service,
    sms_body,
    sms_from,
    from_name,
    email_subject,
    email_body;
  if (!customer_id) {
    return res.status(400).json({ error: "Customer ID is mandatory." });
  }
  const user = await Customer.findOne({ uid: customer_id });
  if (!user) {
    return res.status(400).json({ error: "Invalid Customer" });
  }
  if (!source) {
    return res
      .status(400)
      .json({ error: "Source is mandatory either SMS or Email." });
  }
  if (source.includes("sms")) {
    const smsConfigurations = user.get("sms_configuration");
    let selectedConfig = null;
    for (const config of smsConfigurations) {
      if (config) {
        selectedConfig = config;
        break;
      }
    }
    if (selectedConfig) {
      sms_name = selectedConfig.user_name;
      sms_token = selectedConfig.token;
      sms_service = selectedConfig.service_name;
      if (selectedConfig.selected_option === "number") {
        sms_from = selectedConfig.country_code + selectedConfig.sender_id;
      } else if (selectedConfig.selected_option === "tags") {
        sms_from = selectedConfig.sender_id;
      }
    }
  }

  if (source.includes("email")) {
    const emailConfigurations = user.get("email_configuration");
    for (const config of emailConfigurations) {
      if (config) {
        email_name = config.user_name;
        from_name = config.from_name || "";
        email_token = config.password;
        email_service = config.service_name;
        break;
      }
    }
  }

  if (source.includes("sms") || source.includes("email")) {
    ({ sms_body, email_subject, email_body } = user.get("otp_configuration"));
  }

  const otp = generateCryptoOTP(100);
  try {
    let smsSent = false;
    let emailSent = false;
    if (source.includes("sms")) {
      const messageBody = sms_body.replace(/{%OTP%}/g, otp);
      const smsResponse = await sendSMS(
        sms_service,
        sms_name,
        sms_token,
        messageBody,
        mobileNumber,
        sms_from,
        customer_id
      );
      if (smsResponse.response_code === "SUCCESS") {
        await saveOTP(mobileNumber, otp);
        smsSent = true;
      } else {
        smsSent = false;
      }
    }
    if (source.includes("email")) {
      const subject = email_subject;
      const name = email.split("@")[0];
      const emailTemplate = email_body
        .replace("{%OTP%}", otp)
        .replace("{%XXX%}", name)
        .replace("{%NAME%}", name);
      const emailResponse = await sendEmail(
        email_service,
        email_name,
        email_token,
        email,
        subject,
        emailTemplate,
        customer_id
      );
      if (
        emailResponse &&
        emailResponse.response &&
        emailResponse.response.startsWith("250")
      ) {
        await saveOTP(mobileNumber || "", otp, email);
        emailSent = true;
      } else {
        emailSent = false;
      }
    }
    if (smsSent && emailSent) {
      res
        .status(200)
        .json({ message: "OTP sent successfully via SMS and email" });
    } else if (smsSent) {
      res.status(200).json({ message: "OTP sent successfully via SMS" });
    } else if (emailSent) {
      res.status(200).json({ message: "OTP sent successfully via email" });
    } else if (source.includes("sms") && !smsSent) {
      res.status(500).json({ error: "Failed to send OTP via SMS" });
    } else if (source.includes("email") && !emailSent) {
      res.status(500).json({ error: "Failed to send OTP via email" });
    } else {
      res.status(400).json({ error: "Invalid source provided." });
    }
  } catch (error) {
    res.status(500).json({ error: `Error sending OTP: ${error.message}` });
  }
};

const saveOTP = async (mobileNumber, otp, email) => {
  const Uid = crypto.randomBytes(16).toString("hex");
  const newOtp = new Otp({
    uid: Uid,
    mobile_number: mobileNumber,
    email: email,
    otp,
    is_active: true,
  });
  try {
    await newOtp.save();
  } catch (error) {
    console.error("Error saving OTP:", error);
  }
};

// const verifyOTP = async (req, res) => {
//     const { mobileNumber, verificationCode } = req.body;
//     const staticVerificationCode = '123456';

//     try {
//         if (verificationCode === staticVerificationCode) {
//             res.status(200).json({ message: 'OTP Verified Successfully' });
//         } else {
//             res.status(400).json({ error: 'Invalid OTP' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Error verifying OTP' });
//     }
// };

const verifyOTP = async (req, res) => {
  const { mobileNumber, verificationCode, email, source } = req.body;
  try {
    if (source.includes("sms")) {
      if (!mobileNumber || !verificationCode) {
        return res.status(400).json({ error: `Missing required fields` });
      }
      const latestOTP = await Otp.findOne({
        mobile_number: mobileNumber,
        otp: verificationCode,
        is_active: true,
      }).sort({ created_at: -1 });
      if (latestOTP) {
        return res.status(200).json({ message: `OTP Verified Successfully` });
      } else {
        return res.status(400).json({ error: `Invalid OTP` });
      }
    }
    if (source.includes("email")) {
      if (!email || !verificationCode) {
        return res.status(400).json({ error: `Missing required fields` });
      }

      const latestOTP = await Otp.findOne({
        email,
        otp: verificationCode,
        is_active: true,
      }).sort({ created_at: -1 });

      if (latestOTP) {
        return res.status(200).json({ message: `OTP Verified Successfully` });
      } else {
        return res.status(400).json({ error: `Invalid OTP` });
      }
    }
    return res.status(400).json({ error: `Invalid source` });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error verifying OTP for ${mobileNumber || email}` });
  }
};

module.exports = {
  sendOTP: sendOTP,
  verifyOTP: verifyOTP,
};
