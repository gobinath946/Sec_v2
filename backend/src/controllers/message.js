const Message = require("../models/model").Message;
const Customer = require("../models/model").Customer;
const User = require("../models/model").User;
const EmailTemp = require("../models/model").emailtemp;
const gets3Url = require("../Libs/s3customer").gets3Url;
const generateShortURL = require("../Libs/urlshortner");
const sendSMS = require("../Libs/clicksendsms");
const sendEmail = require("../Libs/sendemail");
const sendEmail2 = require("../Libs/sendemail2");
const status_code = require("../Libs/constants");
const jwt = require("jsonwebtoken");
const { createLog } = require("./log");

const fs = require("fs");
const fs_extra = require("fs-extra");
const convertDocxBufferToTextBuffer =
  require("../Libs/fileconverter").convertDocxBufferToTextBuffer;
const convertDocxBufferToHtmlBuffer =
  require("../Libs/fileconverter").convertDocxBufferToHtmlBuffer;
const embedImagesAsBase64 =
  require("../Libs/fileconverter").embedImagesAsBase64;

const getMessageById = async (req, res) => {
  const uid = req.params.uid;
  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }
  try {
    let message = await Message.findOne({ uid: uid, expired: false });
    if (!message) {
      return res
        .status(404)
        .json({ message: "Data not found for provided Uid" });
    }
    const linkValidity = message.message_custom_data?.link_validity;
    if (linkValidity) {
      const now = new Date();
      const linkExpiry = new Date(linkValidity);

      if (linkExpiry < now) {
        return res
          .status(404)
          .json({ message: "Data not found for provided Uid" });
      }
    }

    await Message.updateOne(
      { uid: uid, expired: false },
      {
        $set: { status: "opened" },
        $push: {
          statusHistory: {
            status: message.is_readable ? "preview_opened" : "link_opened",
            datetime: new Date(),
            action: message.action,
          },
        },
      }
    );
    await createLog(
      {
        trigger_event: message.is_readable
          ? "Preview Open Event"
          : "Link Open Event",
        message_id: uid,
        email: message.recipient_email,
      },
      { req }
    );

    const customer = await Customer.findOne({ uid: message.customer_id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const branding = customer.branding;
    res.status(200).json({ message, branding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getResultBranding = async (req, res) => {
  const uid = req.params.uid;
  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }
  try {
    let message = await Message.findOne({ uid: uid });
    if (!message) {
      return res
        .status(404)
        .json({ message: "Data not found For Provided Uid" });
    }
    await createLog(
      {
        trigger_event: "Result Page Event",
        message_id: uid,
        email: message.recipient_email,
      },
      { req }
    );
    await Message.updateOne(
      { uid: uid, expired: false },
      {
        $set: { status: "closed" },
        $push: {
          statusHistory: {
            status: "result_page",
            datetime: new Date(),
            action: message.action,
          },
        },
      }
    );
    const customer = await Customer.findOne({ uid: message.customer_id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const branding = customer.branding;
    const cus_id = customer.uid;
    res.status(200).json({ branding, cus_id });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStatusHistoryByExternalIds = async (req, res) => {
  const { message_externalid, recipient_externalid } = req.params;
  if (!message_externalid) {
    return res.status(400).json({ message: "message_externalid is required" });
  }
  if (!recipient_externalid) {
    return res
      .status(400)
      .json({ message: "recipient_externalid is required" });
  }
  try {
    let message = await Message.findOne({
      message_externalid,
      recipient_originalid: recipient_externalid,
    });
    if (!message) {
      return res
        .status(404)
        .json({ message: "Data not found for provided external IDs" });
    }

    const statusHistory = message.statusHistory;
    const messages = message.messages;
    const groupedHistory = {};
    statusHistory.forEach((hist) => {
      if (!groupedHistory[hist.action]) {
        groupedHistory[hist.action] = [];
      }
      groupedHistory[hist.action].push(hist);
    });
    const formattedMessages = messages.map((msg) => {
      const link_history = groupedHistory[msg.action] || [];
      return {
        ...msg,
        link_history,
      };
    });

    res.status(200).json(formattedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getMessageData = async (req, res) => {
  const { secret_key } = req.query;
  if (!secret_key) {
    return res.status(400).json({ error: "Key is mandatory" });
  }

  try {
    const decodedToken = jwt.verify(secret_key, status_code.SECRET_KEY);
    if (!decodedToken) {
      return res
        .status(status_code.UNAUTHORIZED_STATUS)
        .json({ error: "Invalid Secret Key" });
    }
    if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
      return res
        .status(status_code.UNAUTHORIZED_STATUS)
        .json({ error: "Expired Secret Key" });
    }
  } catch (error) {
    return res.status(400).json({ error: "Illegal Access" });
  }
  const { message_externalid } = req.params;
  if (!message_externalid) {
    return res.status(400).json({ message: "message_externalid is required" });
  }

  try {
    let message = await Message.findOne({ message_externalid });
    if (!message) {
      return res
        .status(404)
        .json({ message: "Data not found for provided external IDs" });
    }

    const track_details = message.statusHistory;
    const s3info = message.response;
    res.status(200).json({ track_details, s3info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const LinkDistributor = async (req, res) => {
  const requestData = req.body;
  const uid = requestData.internal_message_id;
  const cus_id = requestData.cus_id;
  let sms_token,
    sms_name,
    email_token,
    email_name,
    shorturl,
    email_service,
    sms_service,
    from_name,
    sms_from;
  let smsSuccess = false;
  let emailSuccess = false;
  const email = [];
  const sms = [];
  const data = [];

  if (!uid) {
    return res.status(400).json({ error: "Uid is mandatory" });
  }

  if (!cus_id) {
    return res.status(400).json({ error: "Customer ID is mandatory" });
  }

  const message = await Message.findOne({ uid: uid });

  if (!message) {
    return res
      .status(400)
      .json({ error: "Message Not Found For the Provided ID" });
  }

  const user = await Customer.findOne({ uid: cus_id });

  if (!user) {
    return res.status(400).json({ error: "Invalid token" });
  }

  const customer_id = message.customer_id;

  const valid_cus = await User.findOne({ user_uid: customer_id });
  if (valid_cus.credits === 0) {
    return res.status(400).json({
      error: "No credits available. Customer Need To recharge This Account",
    });
  }
  const pageConfig = user.page_configuration.find(
    (config) => config.action === message.action
  );

  if (!pageConfig) {
    return res
      .status(400)
      .json({ error: "Page configuration not found for the action" });
  }

  if (message.action === "Link_Creator" || message.action === "Ajm_Link") {
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

  if (message.action === "Link_Creator" || message.action === "Ajm_Link") {
    const emailConfigurations = user.get("email_configuration");
    for (const config of emailConfigurations) {
      if (config) {
        email_name = config.user_name;
        email_token = config.password;
        email_service = config.service_name;
        from_name = config.from_name || "";
        break;
      }
    }
  }

  try {
    if (message.action === "Link_Creator" && message.is_readable === true) {
      let Temp_name;
      if (message.message_custom_data.Quote_Proposal) {
        Temp_name = "QUOTE_PROPOSAL";
      }
      if (message.message_custom_data.Stakeholder_Acknowledgment) {
        Temp_name = "STAKE_HOLDER";
      }
      const email_data = await EmailTemp.findOne({ templateName: Temp_name });
      const sign = message.email_sign_details;
      if (!email_data) {
        return res
          .status(400)
          .json({ error: "Email Template Not Found For the Paylaod" });
      }

      if (!message.sharepoint_folder_path) {
        return res
          .status(400)
          .json({ error: "Share Point Folder Is Not Found" });
      }
      if (!message.sharepoint_filename) {
        return res
          .status(400)
          .json({ error: "Share Point File Name Not Found " });
      }
      const replacedURL = pageConfig.url
        .replace("{%action%}", pageConfig.action)
        .replace("{%uid%}", uid)
        .replace("{%template%}", pageConfig.template);
      const urlParam = `${replacedURL}?source=${message.msg_service}?otp_page=true`;

      const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
      try {
        const api_keys = user.applnx_api_keys;
        const url_response = await generateShortURL(
          api_keys,
          signature,
          urlParam
        );
        if (!url_response) {
          return res.status(400).json({ error: "Failed to retrieve ShortUrl" });
        }
        shorturl = url_response;
      } catch (error) {
        return res.status(400).json({ error: "Failed to retrieve ShortUrl" });
      }

      if (message.msg_service.includes("sms")) {
        const messageBody = pageConfig.SMS_Content.replace(
          "{%URL%}",
          shorturl
        ).replace("{%XXX%}", recipient.name);
        const smsResponse = await sendSMS(
          sms_service,
          sms_name,
          sms_token,
          messageBody,
          recipient.mobile,
          sms_from,
          customer_id
        );
        if (smsResponse.response_code === "SUCCESS") {
          smsSuccess = true;
          sms.push(`${smsResponse.response_msg} For ${recipient.name} `);
        } else {
          sms.push({ error: `Failed to send SMS to ${recipient.mobile}` });
        }
      }
      if (message.msg_service.includes("email")) {
        const msg_data = message.message_custom_data;
        let Project_Address;
        if (msg_data.Quote_Proposal) {
          Project_Address = `${msg_data.Quote_Proposal.Site_Street},${msg_data.Quote_Proposal.Site_State},${msg_data.Quote_Proposal.Site_city}`;
        }
        if (msg_data.Stakeholder_Acknowledgment) {
          Project_Address = `${msg_data.Stakeholder_Acknowledgment.Site_Street},${msg_data.Stakeholder_Acknowledgment.Site_State},${msg_data.Stakeholder_Acknowledgment.Site_city}`;
        }
        if (
          !message.message_custom_data.s3url ||
          !Array.isArray(message.message_custom_data.s3url)
        ) {
          return res
            .status(400)
            .json({ error: "s3url must be an array and is mandatory" });
        }
        let errorLogNames = [];
        for (const s3url of message.message_custom_data.s3url) {
          if (typeof s3url.expiration_time !== "number") {
            errorLogNames.push(s3url.logo_name);
          }
        }

        if (errorLogNames.length > 0) {
          const errorLogNamesString = errorLogNames.join(", ");
          return res.status(400).json({
            error: `Expiration time must be a number for logos: ${errorLogNamesString}`,
          });
        }

        let s3Urls = {};

        for (const s3url of message.message_custom_data.s3url) {
          const logoName = s3url.logo_name;
          const signUrl = await gets3Url(
            customer_id,
            s3url.logo_name,
            s3url.expiration_time
          );

          if (!signUrl) {
            console.error(
              `Failed to retrieve S3 URL for logo: ${s3url.logo_name}`
            );
            continue;
          }
          s3Urls[logoName] = signUrl;
        }

        let emailTemplate = `${email_data.templateData.html
          .replace("{%URL%}", shorturl)
          .replace("{%org_owner_name%}", sign.org_owner_name)
          .replace("{%org_owner_info%}", sign.org_owner_info)
          .replace("{%org_owner_designation%}", sign.org_owner_designation)
          .replace("{%org_owner_company_name%}", sign.org_owner_company_name)
          .replace("{%org_owner_mobile%}", sign.org_owner_mobile)
          .replace("{%org_owner_phone%}", sign.org_owner_phone)
          .replace("{%org_owner_email%}", sign.org_owner_email)
          .replace("{%org_owner_wesite%}", sign.org_owner_wesite)
          .replace(
            "{%org_owner_company_address%}",
            sign.org_owner_company_address
          )
          .replace("{%XXX%}", message.recipient_name)
          .replace("{%ADDRESS%}", Project_Address)}`;
        if (s3Urls["Email_Sign"]) {
          emailTemplate = emailTemplate.replace(
            "{%email_sign%}",
            s3Urls["Email_Sign"]
          );
        }
        const subject = email_data.subject;
        const ext_sf_id = message.message_externalid;
        let cc = message.alternate_email;
        const emailResponse = await sendEmail2(
          email_service,
          email_name,
          email_token,
          message.recipient_email,
          subject,
          emailTemplate,
          customer_id,
          "",
          cc,
          ext_sf_id,
          "",
          from_name
        );
        if (
          emailResponse &&
          emailResponse.response &&
          emailResponse.response.startsWith("250")
        ) {
          emailSuccess = true;
          email.push(
            `Email has been sent successfully to ${message.recipient_email}`
          );
        } else if (emailResponse && emailResponse.error) {
          email.push({
            error: `Failed to send emailto ${message.recipient_email}`,
          });
        } else {
          email.push({ error: "Failed to send email: Unexpected response" });
        }
      }
      if (smsSuccess || emailSuccess) {
        data.push(
          `Link Distributed successfully For ${message.recipient_name}`
        );
        await Message.updateOne({ uid: uid }, { $set: { is_readable: false } });
      }
    } else if (message.action === "Ajm_Link" && message.is_readable === true) {
      console.log("gobi");
      let Temp_name;
      if (message.message_custom_data.Ajm_Data) {
        Temp_name = "AJM_QUOTE";
      }
      const email_data = await EmailTemp.findOne({ templateName: Temp_name });

      const shortUrl = message.shorten_link.find(
        (link) => link.action === message.action
      );
      const shortenLink = shortUrl.url;

      if (!shortenLink) {
        return res.status(400).json({ error: "Preview Link Not Found" });
      }

      if (!email_data) {
        return res
          .status(400)
          .json({ error: "Email Template Not Found For the Paylaod" });
      }

      if (message.msg_service.includes("sms")) {
        const messageBody = pageConfig.SMS_Content.replace(
          "{%URL%}",
          shorturl
        ).replace("{%XXX%}", recipient.name);
        const smsResponse = await sendSMS(
          sms_service,
          sms_name,
          sms_token,
          messageBody,
          recipient.mobile,
          sms_from,
          customer_id
        );
        if (smsResponse.response_code === "SUCCESS") {
          smsSuccess = true;
          sms.push(`${smsResponse.response_msg} For ${recipient.name} `);
        } else {
          sms.push({ error: `Failed to send SMS to ${recipient.mobile}` });
        }
      }
      if (message.msg_service.includes("email")) {
        const sign = requestData.email_sign_details;
        let emailTemplate = `${email_data.templateData.html
          .replace("{%URL%}", shortenLink)
          .replace("{%XXX%}", message.recipient_name)
          .replace("{%org_owner_name%}", sign?.org_owner_name)
          .replace("{%org_owner_info%}", sign?.org_owner_info)
          .replace("{%org_owner_designation%}", sign?.org_owner_designation)
          .replace("{%org_owner_company_name%}", sign?.org_owner_company_name)
          .replace("{%org_owner_mobile%}", sign?.org_owner_mobile)
          .replace("{%org_owner_phone%}", sign?.org_owner_phone)
          .replace("{%org_owner_email%}", sign?.org_owner_email)
          .replace("{%org_owner_wesite%}", sign?.org_owner_wesite)
          .replace(
            "{%org_owner_company_address%}",
            sign?.org_owner_company_address
          )}`;

        const subject = email_data.subject;
        const id = message.message_externalid;
        let cc = message.alternate_email;
        const emailResponse = await sendEmail2(
          email_service,
          email_name,
          email_token,
          message.recipient_email,
          subject,
          emailTemplate,
          customer_id,
          "",
          cc,
          id,
          "",
          from_name
        );
        if (
          emailResponse &&
          emailResponse.response &&
          emailResponse.response.startsWith("250")
        ) {
          emailSuccess = true;
          email.push(
            `Email has been sent successfully to ${message.recipient_email}`
          );
        } else if (emailResponse && emailResponse.error) {
          email.push({
            error: `Failed to send emailto ${message.recipient_email}`,
          });
        } else {
          email.push({ error: "Failed to send email: Unexpected response" });
        }
      }
      if (smsSuccess || emailSuccess) {
        await createLog(
          {
            trigger_event: "Link Sent Event",
            message_id: uid,
            email: message.recipient_email,
          },
          { req }
        );
        await Message.updateOne(
          { uid: message.uid, expired: false },
          {
            $set: { status: "distribution" },
            $push: {
              statusHistory: {
                status: "link_distributed",
                datetime: new Date(),
                action: requestData.action,
              },
            },
          }
        );
        data.push(
          `Link Distributed successfully For ${message.recipient_name}`
        );
        await Message.updateOne({ uid: uid }, { $set: { is_readable: false } });
      }
    } else {
      data.push(`Message Has Already Been Distributed`);
    }
    res.status(200).json({ message: data, sms, email });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

const DocToText = async (req, res) => {
  const filePath = req.file.path;

  if (!filePath) {
    return res.status(400).json({ error: "File Is Required" });
  }

  try {
    const docxBuffer = fs.readFileSync(filePath);
    const textBuffer = await convertDocxBufferToTextBuffer(docxBuffer);

    const text = textBuffer.toString();
    fs.unlinkSync(filePath);

    res.json({ text });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file");
  }
};

const DocToHtml = async (req, res) => {
  const filePath = req.file.path;

  if (!filePath) {
    return res.status(400).json({ error: "File is required" });
  }

  try {
    const docxBuffer = await fs_extra.promises.readFile(filePath);
    let htmlBuffer = await convertDocxBufferToHtmlBuffer(docxBuffer);
    htmlBuffer = await embedImagesAsBase64(docxBuffer, htmlBuffer);
    const html = htmlBuffer.toString();
    await fs_extra.promises.unlink(filePath);

    res.json({ html });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file");
  }
};

const UrlToHtml = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send("Missing URL in request body.");
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    res.send(html);
  } catch (error) {
    console.error("Error fetching HTML:", error);
    res.status(500).send("Failed to fetch HTML content.");
  }
};

module.exports = {
  getMessageById: getMessageById,
  getResultBranding: getResultBranding,
  getStatusHistoryByExternalIds: getStatusHistoryByExternalIds,
  getMessageData: getMessageData,
  LinkDistributor: LinkDistributor,
  DocToText: DocToText,
  DocToHtml: DocToHtml,
  UrlToHtml: UrlToHtml,
};
