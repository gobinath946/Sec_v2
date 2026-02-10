const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Customer = require("../models/model").Customer;
const Message = require("../models/model").Message;
const Logs = require("../models/model").Logs;
const config = require("../../config/environment/dbDependencies");
const sendEmail = require("./sendemail");
const pdf = require("html-pdf-node");
const axios = require("axios");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const EmailTemp = require("../models/model").emailtemp;
const { createLog } = require("../controllers/log");

const S3Upload = async (req, res) => {
  const uid = req.params.uid;
  const type = req.body.type;
  const pageName = req.body.pageName;
  let email_token, email_name, email_service, from_name;

  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }

  if (
    !type ||
    (type !== "assets" &&
      type !== "file" &&
      type !== "templates" &&
      type !== "html")
  ) {
    return res.status(400).json({ message: "Invalid type" });
  }

  try {
    const customer = await Customer.findOne({ uid });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customer_id = customer.get("uid");

    const folderName = `${customer_id}`;
    const config_data = customer.get("file_configuration");

    if (!Array.isArray(config_data) || config_data === 0) {
      return res
        .status(400)
        .json({ message: "No file configuration found for this user" });
    }

    const emailConfigurations = customer.get("email_configuration");
    for (const config of emailConfigurations) {
      if (config) {
        email_name = config.user_name;
        email_token = config.password;
        email_service = config.service_name;
        from_name = config.from_name || "";
        break;
      }
    }
    if (type === "file") {
      const data = req.body;
      const file_data = data.file;
      const file_name = data.file_name;
      const file_mime_type = data.file_mime_type;
      const message_id = data.message_id;
      const rec_email = data.rec_email;
      const action = data.action;
      const service = data.service;
      const msg_id = data.msg_id;
      const pdf_name = data.pdf_name;
      const signatures = data.signatures;
      const stepper = data.stepper;
      const selectedPackage = data.selectedPackage;
      const q_monthly = data.q_monthly;
      const q_fortnightly = data.q_fortnightly;
      const q_weekly = data.q_weekly;
      const paymentFrequency = data.paymentFrequency;

      if (!file_data) {
        return res.status(400).json({ message: "file is required" });
      }
      if (!file_name) {
        return res.status(400).json({ message: "file_name is required" });
      }
      if (!file_mime_type) {
        return res.status(400).json({ message: "file_mime_type is required" });
      }
      if (!message_id) {
        return res.status(400).json({ message: "message_id is required" });
      }
      if (!rec_email) {
        return res.status(400).json({ message: "rec_email is required" });
      }
      if (!service) {
        return res.status(400).json({ message: "Service is required" });
      }

      const pageConfig = customer.page_configuration.find(
        (config) => config.action === action
      );
      const fileConfig = config_data.find(
        (config) => config.service_name === service
      );

      if (!pageConfig) {
        return res
          .status(400)
          .json({ message: "Page configuration not found for the action" });
      }

      if (!fileConfig) {
        return res.status(400).json({
          message: "File configuration for the specified service not found",
        });
      }
      const bucketName = fileConfig.bucket_name;
      const s3Client = new S3Client({
        region: fileConfig.region,
        credentials: {
          accessKeyId: fileConfig.access_key,
          secretAccessKey: fileConfig.secret_key,
        },
      });
      const fileBuffer = Buffer.from(file_data, "base64");
      const filePath = `${config.BaseFolder}/Customer_Files/${folderName}/${file_name}`;
      const attachments = [
        {
          filename: file_name,
          content: fileBuffer,
          contentType: file_mime_type,
        },
      ];

      let sign;
      const foundMessages = await Message.find({ uid: msg_id });
      sign = foundMessages[0].email_sign_details;

      const email_data = await EmailTemp.findOne({
        templateName: "AJM_ATTACHMENT",
      });
      const subject = email_data.subject;

      let emailTemplate = `${email_data.templateData.html
        .replace("{%XXX%}", foundMessages[0].recipient_name)
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
      await sendEmail(
        email_service,
        email_name,
        email_token,
        rec_email,
        subject,
        emailTemplate,
        customer_id,
        attachments,
        "",
        from_name
      );

      const responseItems = [];

      try {
        const uploadParams = {
          Bucket: bucketName,
          Key: filePath,
          Body: fileBuffer,
          ContentType: file_mime_type,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        const newResponseItem = {
          created_at: new Date(),
          action: action,
          data: file_name,
          link: filePath,
        };
        responseItems.push(newResponseItem);
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        return res
          .status(500)
          .json({ message: "Error uploading file to Dropbox" });
      }

      const payloads = {
        Quote_Proposal: {
          message_id: message_id,
        },
      };

      const payloadToSend = payloads[pdf_name] || null;
      if (pdf_name === "Quote_Proposal") {
        try {
          const response = await axios.post(
            `https://performsolutions--dev.sandbox.my.salesforce-sites.com/services/apexrest/documentCollection?pdf_name=${pdf_name}`,
            payloadToSend,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } catch (axiosError) {
          console.error(
            "Error response from Salesforce:",
            axiosError.response?.data || axiosError.message
          );
          return res.status(500).json({
            message: "Error posting data to Salesforce",
            error: axiosError.message,
          });
        }
      } else if (pdf_name === "Ajm_Insurance_Esign") {
        const apiKey = foundMessages[0].message_custom_data.app_api_key;

        const url = `https://api.hubapi.com/crm/v3/objects/0-3/${message_id}`;

        const requestBody = {
          insurance_signed_document: filePath,
          q_customer_selection: selectedPackage,
          q_monthly: q_monthly || 0,
          q_fortnightly: q_fortnightly || 0,
          q_weekly: q_weekly || 0,
          pay_frequency: paymentFrequency
            ? paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1).toLowerCase()
            : undefined,
          q_e_signed: "true",
        };

        const final_body = {
          properties: requestBody,
        };

        const response = await axios({
          method: "PATCH",
          url: url,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          data: final_body,
        });
      } else if (pdf_name === "Insurance_Declaration") {
        const foundMessageData = foundMessages[0].message_custom_data;

        const sendData = foundMessageData?.Ajm_Autosure_Esign?.send_data;
        const hubData = sendData?.data?.hubData;
        const requestBody = {
          esigned_document: filePath,
          all_links_to_esign: "",
        };

        const final_body = {
          properties: requestBody,
        };
        const response = await axios({
          method: "PATCH",
          url: `${hubData?.document_retrieval_url}/${foundMessages[0]?.message_externalid}`,
          headers: {
            Authorization: `Bearer ${foundMessageData.app_api_key}`,
            "Content-Type": "application/json",
          },
          data: final_body,
        });

        const url = `https://api.hubapi.com/crm/v3/objects/0-3/${sendData?.objectId}`;
        const insuranceType = sendData.insuranceType; // e.g., "mbi", "gap", "ppi"
        const key = `autosure_${insuranceType}_esign_processed`;
        const key2 = `autosure_${insuranceType}_declaration_esign`;

        const requestBody2 = {
          [key]: "true",
          [key2]: "true",
        };

        const final_body2 = {
          properties: requestBody2,
        };

        const response2 = await axios({
          method: "PATCH",
          url: url,
          headers: {
            Authorization: `Bearer ${foundMessageData.app_api_key}`,
            "Content-Type": "application/json",
          },
          data: final_body2,
        });
      } else {
        console.log(
          "PDF name is not Quote_Proposal or Stakeholder_Acknowledgment. No API call will be made."
        );
      }

      let result;
      if (stepper === "ajm_rental") {
        const updatedSignatures = signatures.map((signature) => ({
          ...signature,
          date: signature.date || new Date(), // Add current date if not present
        }));

        await createLog(
          {
            trigger_event: "E_sign Process Completed ",
            message_id: msg_id,
            email: rec_email,
          },
          { req }
        );

        await Message.updateOne(
          { uid: msg_id, expired: false },
          {
            $set: { status: "sign completed" },
            $push: {
              statusHistory: {
                status: "signed_successfully",
                datetime: new Date(),
                action: "E-sign",
              },
            },
          }
        );
        result = await Message.findOneAndUpdate(
          { uid: msg_id },
          {
            $push: {
              response: { $each: responseItems },
              signatures: { $each: updatedSignatures },
            },
            $set: { status: "Responded" },
          },
          { new: true }
        );
      }

      if (!result) {
        return res.status(404).json({ message: "Message not found" });
      }
      return res.json({ message: "Response submitted successfully" });
    } else if (type === "html") {
      const {
        file_name,
        file_mime_type,
        message_id,
        rec_email,
        action,
        service,
        msg_id,
        pdf_name,
        stepper,
        return_data,
        html_link,
      } = req.body;

      try {
        if (!file_name) {
          return res.status(400).json({ message: "file_name is required" });
        }
        if (!file_mime_type) {
          return res
            .status(400)
            .json({ message: "file_mime_type is required" });
        }
        if (!message_id) {
          return res.status(400).json({ message: "message_id is required" });
        }
        if (!rec_email) {
          return res.status(400).json({ message: "rec_email is required" });
        }
        if (!service) {
          return res.status(400).json({ message: "Service is required" });
        }

        const pageConfig = customer.page_configuration.find(
          (config) => config.action === action
        );
        const fileConfig = config_data.find(
          (config) => config.service_name === service
        );

        if (!pageConfig) {
          return res
            .status(400)
            .json({ message: "Page configuration not found for the action" });
        }

        if (!fileConfig) {
          return res.status(400).json({
            message: "File configuration for the specified service not found",
          });
        }

        // Find the message by msg_id
        const foundMessage = await Message.findOne({
          uid: msg_id,
          expired: false,
        });
        if (!foundMessage) {
          return res
            .status(404)
            .json({ message: "Message not found or expired" });
        }

        // Get the secure gateway configuration from the message
        const secureGatewayConfig =
          foundMessage.message_custom_data.secureGatewayConfig;
        const eSignSettings = secureGatewayConfig?.e_sign_settings || "Chain"; // Default to Chain if not specified
        const confidentialData = secureGatewayConfig?.confidential_data || [];

        // Format incoming signatures data from return_data
        const formatSignatureData = () => {
          if (!return_data || typeof return_data !== "object") {
            console.log("No valid return_data found");
            return [];
          }

          const formattedSignatures = [];

          // Find the current signer's configuration
          const currentSignerConfig = confidentialData.find(
            (entry) => entry.e_sign_email === rec_email
          );
          if (!currentSignerConfig) {
            console.log(`No configuration found for recipient: ${rec_email}`);
            return [];
          }

          const email = currentSignerConfig.e_sign_email;
          const order = currentSignerConfig.e_sign_order;
          const signatureEntries = [];

          // Process each e_sign_config entry for this signer
          for (const configItem of currentSignerConfig.e_sign_config || []) {
            const targetId =
              configItem.e_sign_target_id ||
              configItem.e_date_target_id ||
              configItem.e_name_target_id ||
              configItem.target_id;

            const targetType = configItem.target_type;
            let value = null;

            // Check in the appropriate objects based on target type
            if (
              targetType === "sign" &&
              return_data.signatures &&
              return_data.signatures[targetId]
            ) {
              value = return_data.signatures[targetId];
            } else if (
              targetType === "date" &&
              return_data.dates &&
              return_data.dates[targetId]
            ) {
              value = return_data.dates[targetId];
            } else if (
              targetType === "name" &&
              return_data.names &&
              return_data.names[targetId]
            ) {
              value = return_data.names[targetId];
            }

            // Fallback: Check if the value exists directly in return_data
            if (!value && return_data[targetId]) {
              value = return_data[targetId];
            }

            // Only add valid entries
            if (value) {
              const entry = {
                email,
                date: new Date(),
                target_id: targetId,
                target_type: targetType,
              };

              // Dynamically add the target_id as a key
              entry[targetId] = value;

              signatureEntries.push(entry);
            }
          }

          // Only add signatures if entries were found
          if (signatureEntries.length > 0) {
            formattedSignatures.push({
              email,
              order,
              entries: signatureEntries,
              date: new Date(),
            });
          }

          return formattedSignatures;
        };

        const newSignatureData = formatSignatureData();
        const existingSignatures = foundMessage.signatures || [];
        let allSignatures = [...existingSignatures];

        if (newSignatureData.length > 0) {
          const currentSignerEmail = rec_email;
          const currentSignerIndex = existingSignatures.findIndex(
            (sig) => sig.email === currentSignerEmail
          );

          if (currentSignerIndex >= 0) {
            const existingEntries =
              allSignatures[currentSignerIndex].entries || [];
            const newEntries = newSignatureData[0].entries || [];

            const mergedEntries = [...existingEntries];

            for (const newEntry of newEntries) {
              const existingEntryIndex = mergedEntries.findIndex(
                (e) => e.target_id === newEntry.target_id
              );
              if (existingEntryIndex >= 0) {
                mergedEntries[existingEntryIndex] = newEntry;
              } else {
                mergedEntries.push(newEntry);
              }
            }

            allSignatures[currentSignerIndex].entries = mergedEntries;
            allSignatures[currentSignerIndex].date = new Date(); // Update date
          } else {
            allSignatures = [...existingSignatures, ...newSignatureData];
          }
        }

        await createLog(
          {
            trigger_event: "E_sign Process Completed ",
            message_id: msg_id,
            email: rec_email,
          },
          { req }
        );

        await Message.updateOne(
          { uid: msg_id, expired: false },
          {
            signatures: allSignatures,
            $push: {
              statusHistory: {
                status: "signature_received",
                datetime: new Date(),
                action: action,
                email: rec_email,
              },
            },
          }
        );

        // Refresh the message data after update to get the most current signatures
        const updatedMessage = await Message.findOne({
          uid: msg_id,
          expired: false,
        });
        if (!updatedMessage) {
          return res.status(404).json({ message: "Updated message not found" });
        }

        // Use updatedMessage.signatures instead of allSignatures to ensure we have the latest data
        const currentSignatures = updatedMessage.signatures || [];

        if (eSignSettings === "Broadcast") {
          const requiredSignatureCount = confidentialData.length;
          const uniqueSignedEmails = [
            ...new Set(currentSignatures.map((sig) => sig.email)),
          ];
          const isComplete =
            uniqueSignedEmails.length >= requiredSignatureCount;

          if (isComplete) {
            await processCompleteSignatures(
              updatedMessage,
              fileConfig,
              file_name,
              file_mime_type,
              config,
              folderName,
              action,
              rec_email,
              email_service,
              email_name,
              email_token,
              customer_id,
              msg_id,
              html_link,
              req,
              res,
              message_id
            );

            // Note: response will be sent by processCompleteSignatures
          } else {
            return res.json({
              message: "Signature recorded successfully",
              status: "incomplete",
              remainingSignatures:
                requiredSignatureCount - uniqueSignedEmails.length,
            });
          }
        }
        else if (eSignSettings === "Chain") {
          // In chain mode, notify the next signer in sequence
          const currentSignerData = confidentialData.find(
            (data) => data.e_sign_email === rec_email
          );
          const currentOrder = currentSignerData?.e_sign_order || 0;
          const nextSignerData = confidentialData.find(
            (data) => data.e_sign_order === currentOrder + 1
          );

          if (nextSignerData) {
            const nextSignerEmail = nextSignerData.e_sign_email;
            const shortenLink = updatedMessage.shorten_link.find(
              (link) => link.recipient_email === nextSignerEmail
            )?.url;

            if (shortenLink && nextSignerEmail) {
              const apiKey = foundMessage.message_custom_data.app_api_key;
              const normalizedRecipients = Array.isArray(nextSignerData)
                ? nextSignerData
                : [nextSignerData];

              const updatedRecipients = normalizedRecipients.map(
                (recipient) => {
                  return {
                    ...recipient,
                    link: shortenLink,
                  };
                }
              );

              const stringifiedRecipients = JSON.stringify(updatedRecipients);

              const requestBody = {
                all_links_to_esign: stringifiedRecipients,
              };

              const final_body = {
                properties: requestBody,
              };

              const response = await axios({
                method: "PATCH",
                url: foundMessage.message_custom_data.doc_url,
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                data: final_body,
              });

              let sign = foundMessage.email_sign_details;

              const email_data = await EmailTemp.findOne({
                templateName: foundMessage.message_custom_data.quote_temp_name,
              });

              const username = nextSignerEmail.split("@")[0];

              let emailTemplate;
              let emailSubject;

              // Check if next signer is a Manager and use manager-specific email content if available
              if (nextSignerData.user_designation === "Manager") {
                emailTemplate =
                  foundMessage.message_custom_data.manager_email_body &&
                    foundMessage.message_custom_data.manager_email_body.trim() !== ""
                    ? foundMessage.message_custom_data.manager_email_body
                    : email_data.templateData.html;

                emailSubject =
                  foundMessage.message_custom_data.manager_email_subject &&
                    foundMessage.message_custom_data.manager_email_subject.trim() !== ""
                    ? foundMessage.message_custom_data.manager_email_subject
                    : email_data.subject;
              } else {
                emailTemplate =
                  foundMessage.message_custom_data.email_body &&
                    foundMessage.message_custom_data.email_body.trim() !== ""
                    ? foundMessage.message_custom_data.email_body
                    : email_data.templateData.html;

                emailSubject =
                  foundMessage.message_custom_data.email_subject &&
                    foundMessage.message_custom_data.email_subject.trim() !== ""
                    ? foundMessage.message_custom_data.email_subject
                    : email_data.subject;
              }

              emailTemplate = emailTemplate
                .replace(/{%URL%}/g, shortenLink)
                .replace(/{%XXX%}/g, username);

              if (sign) {
                emailTemplate = emailTemplate
                  .replace(/{%org_owner_name%}/g, sign?.org_owner_name || "")
                  .replace(/{%org_owner_info%}/g, sign?.org_owner_info || "")
                  .replace(
                    /{%org_owner_designation%}/g,
                    sign?.org_owner_designation || ""
                  )
                  .replace(
                    /{%org_owner_company_name%}/g,
                    sign?.org_owner_company_name || ""
                  )
                  .replace(
                    /{%org_owner_mobile%}/g,
                    sign?.org_owner_mobile || ""
                  )
                  .replace(/{%org_owner_phone%}/g, sign?.org_owner_phone || "")
                  .replace(/{%org_owner_email%}/g, sign?.org_owner_email || "")
                  .replace(
                    /{%org_owner_wesite%}/g,
                    sign?.org_owner_wesite || ""
                  )
                  .replace(
                    /{%org_owner_company_address%}/g,
                    sign?.org_owner_company_address || ""
                  );
              }
              if (sign) {
                const delimiterPattern = /\{\{%(.*?)%\}\}/g;

                emailTemplate = emailTemplate.replace(
                  delimiterPattern,
                  (_, rawKey) => {
                    // clean up the key (remove hidden characters, trim spaces)
                    const key = rawKey.replace(/[^\x20-\x7E]/g, "").trim();

                    // return the replacement if found, otherwise keep the original placeholder
                    return Object.prototype.hasOwnProperty.call(sign, key)
                      ? String(sign[key] ?? "")
                      : `{{%${key}%}}`; // leave as-is if no value found
                  }
                );
              }

              await sendEmail(
                email_service,
                email_name,
                email_token,
                nextSignerEmail,
                emailSubject,
                emailTemplate,
                customer_id,
                [],
                "",
                from_name
              );

              return res.json({
                message:
                  "Signature recorded successfully, notification sent to next signer",
                status: "forwarded",
                nextSigner: nextSignerEmail,
              });
            }
          } else {
            // No next signer, process as complete
            await processCompleteSignatures(
              updatedMessage,
              fileConfig,
              file_name,
              file_mime_type,
              config,
              folderName,
              action,
              rec_email,
              email_service,
              email_name,
              email_token,
              customer_id,
              msg_id,
              html_link,
              req,
              res,
              message_id
            );
            // Note: response will be sent by processCompleteSignatures
          }
        } else {
          return res
            .status(400)
            .json({ message: "Invalid e_sign_settings value" });
        }
      } catch (error) {
        console.error("Error in HTML processing:", error);
        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
          return res
            .status(500)
            .json({ message: `Error processing HTML: ${error.message}` });
        }
      }
    }

    async function processCompleteSignatures(
      foundMessage,
      fileConfig,
      file_name,
      file_mime_type,
      config,
      folderName,
      action,
      rec_email,
      email_service,
      email_name,
      email_token,
      customer_id,
      msg_id,
      html_link,
      req,
      res,
      message_id
    ) {
      try {
        const bucketName = fileConfig.bucket_name;
        const s3Client = new S3Client({
          region: fileConfig.region,
          credentials: {
            accessKeyId: fileConfig.access_key,
            secretAccessKey: fileConfig.secret_key,
          },
        });

        let htmlContent;
        try {
          const response = await axios.get(html_link, { timeout: 5000 });
          htmlContent = response.data;
        } catch (error) {
          console.error("Error fetching HTML:", error.message);
          return res
            .status(500)
            .json({ message: "Failed to fetch HTML content" });
        }

        let updatedHtml = htmlContent;
        const remove_elements =
          foundMessage?.message_custom_data?.secureGatewayConfig
            ?.remove_target_elements;
        console.log(remove_elements);

        // Remove target elements based on remove_elements array
        if (remove_elements && Array.isArray(remove_elements)) {
          remove_elements.forEach((targetId) => {
            if (targetId && targetId.trim()) {
              // Remove elements by ID - handles various HTML structures
              const patterns = [
                // Match div with specific id
                new RegExp(
                  `<div[^>]*id="${targetId.trim()}"[^>]*>.*?</div>`,
                  "gis"
                ),
                // Match button with specific id
                new RegExp(
                  `<button[^>]*id="${targetId.trim()}"[^>]*>.*?</button>`,
                  "gis"
                ),
                // Match input with specific id
                new RegExp(
                  `<input[^>]*id="${targetId.trim()}"[^>]*[/]?>`,
                  "gis"
                ),
                // Match span with specific id
                new RegExp(
                  `<span[^>]*id="${targetId.trim()}"[^>]*>.*?</span>`,
                  "gis"
                ),
                // Match a with specific id
                new RegExp(
                  `<a[^>]*id="${targetId.trim()}"[^>]*>.*?</a>`,
                  "gis"
                ),
                // Generic pattern for any element with the id
                new RegExp(
                  `<[^>]*id="${targetId.trim()}"[^>]*>.*?</[^>]*>`,
                  "gis"
                ),
                // Self-closing tags
                new RegExp(`<[^>]*id="${targetId.trim()}"[^>]*[/]?>`, "gis"),
              ];

              patterns.forEach((pattern) => {
                updatedHtml = updatedHtml.replace(pattern, "");
              });

              console.log(`Removed elements with ID: ${targetId}`);
            }
          });
        }

        // Add signatures to the HTML
        if (foundMessage.signatures && Array.isArray(foundMessage.signatures)) {
          foundMessage.signatures.forEach((signer) => {
            if (signer.entries && Array.isArray(signer.entries)) {
              signer.entries.forEach((entry) => {
                const targetId = entry.target_id;
                const value = entry[targetId];

                if (targetId && value) {
                  const pattern = new RegExp(
                    `<div[^>]*id="${targetId}"[^>]*>.*?</div>`,
                    "gs"
                  );
                  if (entry.target_type === "sign") {
                    updatedHtml = updatedHtml.replace(
                      pattern,
                      `<div id="${targetId}"><img src="${value}" alt="Signature" style="max-width: 100px;"/></div>`
                    );
                  } else {
                    updatedHtml = updatedHtml.replace(
                      pattern,
                      `<div id="${targetId}">${value}</div>`
                    );
                  }
                }
              });
            }
          });
        }

        // Add page break styling for elements with id="secure-section-break"
        updatedHtml = updatedHtml.replace(
          /<div([^>]*)id="secure-section-break"([^>]*)>/g,
          '<div$1id="secure-section-break"$2 style="page-break-before: always;">'
        );

        // Add CSS for page breaks in the head section
        if (!updatedHtml.includes('<style id="page-break-styles">')) {
          const styleTag = `
    <style id="page-break-styles">
      @media print {
        #secure-section-break {
          page-break-before: always;
        }
        /* Ensure no other elements cause page breaks */
        * {
          page-break-inside: avoid;
        }
        /* Reset for secure-section-break containers */
        div:not(#secure-section-break) {
          page-break-before: avoid;
          page-break-after: avoid;
        }
        .audit-trail-page {
          page-break-before: always;
          page-break-after: avoid;
        }
      }
    </style>
  `;

          // Insert the style tag into the head
          updatedHtml = updatedHtml.replace("</head>", `${styleTag}</head>`);
        }

        // **NEW: Fetch audit trail logs and generate audit page**
        let auditTrailHtml = "";
        try {
          // Fetch logs from database using the message ID
          const auditLogs = await Logs.find({
            message_id: msg_id,
          }).sort({ creation_time: 1 });

          // if (auditLogs && auditLogs.length > 0) {
          //   auditTrailHtml = generateAuditTrailPage(auditLogs, foundMessage);
          // }
        } catch (logError) {
          console.error("Error fetching audit logs:", logError.message);
          // Continue without audit trail if logs can't be fetched
        }

        // Add audit trail page before closing body tag
        if (auditTrailHtml) {
          updatedHtml = updatedHtml.replace(
            "</body>",
            `${auditTrailHtml}</body>`
          );
        }

        // 3. Upload modified HTML to S3 temporarily
        const tempHtmlName = `temp_${Date.now()}_${file_name.replace(
          ".pdf",
          ".html"
        )}`;
        const tempHtmlPath = `${config.BaseFolder}/Customer_Files/${folderName}/temp/${tempHtmlName}`;

        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: tempHtmlPath,
              Body: updatedHtml,
              ContentType: "text/html",
            })
          );
        } catch (error) {
          console.error("S3 HTML upload failed:", error.message);
          return res
            .status(500)
            .json({ message: "Failed to save temporary HTML" });
        }

        const tempHtmlUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: tempHtmlPath,
          }),
          { expiresIn: 3600 }
        );

        let pdfBuffer;
        try {
          const options = {
            format: "A3",
            printBackground: true,
            margin: {
              top: "2mm",
              bottom: "2mm",
              left: "2mm",
              right: "2mm",
            },
            preferCSSPageSize: true, // Honor CSS page size settings
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          };

          pdfBuffer = await pdf.generatePdf({ url: tempHtmlUrl }, options);
        } catch (error) {
          console.error("PDF generation failed:", error.message);
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: tempHtmlPath,
              })
            );
          } catch (cleanupError) {
            console.error(
              "Failed to clean up temporary HTML:",
              cleanupError.message
            );
          }

          return res.status(500).json({ message: "Failed to generate PDF" });
        }

        // 5. Save final PDF to S3
        const filePath = `${config.BaseFolder}/Customer_Files/${folderName}/${file_name}`;

        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: filePath,
              Body: pdfBuffer, // Use the raw buffer directly
              ContentType: file_mime_type,
            })
          );
        } catch (error) {
          console.error("S3 PDF upload failed:", error.message);
          return res.status(500).json({ message: "Failed to save PDF" });
        }

        // 6. Send email with attachment
        const allEmails = [
          foundMessage.recipient_email,
          ...(foundMessage.signatures?.map((sig) => sig.email) || []),
        ].filter(Boolean);

        const uniqueEmails = [...new Set(allEmails)];

        let sign;
        sign = foundMessage.email_sign_details;

        const email_data = await EmailTemp.findOne({
          templateName: foundMessage.message_custom_data.attach_temp_name,
        });



        const attachments = [
          {
            filename: file_name,
            content: pdfBuffer, // Use the raw buffer directly
            contentType: file_mime_type,
          },
        ];

        for (const email of uniqueEmails) {
          const username = email.split("@")[0];

          let emailTemplate =
            foundMessage.message_custom_data.pdf_content &&
              foundMessage.message_custom_data.pdf_content.trim() !== ""
              ? foundMessage.message_custom_data.pdf_content
              : email_data.templateData.html;

          // Use email_subject from payload if available and not null/empty, otherwise use template subject
          const emailSubject =
            foundMessage.message_custom_data.signed_email_subject &&
              foundMessage.message_custom_data.signed_email_subject.trim() !== ""
              ? foundMessage.message_custom_data.signed_email_subject
              : email_data.subject;



          if (sign) {
            emailTemplate = emailTemplate
              .replace(/{%org_owner_name%}/g, sign?.org_owner_name || "")
              .replace(/{%org_owner_info%}/g, sign?.org_owner_info || "")
              .replace(/{%XXX%}/g, username)
              .replace(
                /{%org_owner_designation%}/g,
                sign?.org_owner_designation || ""
              )
              .replace(
                /{%org_owner_company_name%}/g,
                sign?.org_owner_company_name || ""
              )
              .replace(
                /{%org_owner_mobile%}/g,
                sign?.org_owner_mobile || ""
              )
              .replace(/{%org_owner_phone%}/g, sign?.org_owner_phone || "")
              .replace(/{%org_owner_email%}/g, sign?.org_owner_email || "")
              .replace(
                /{%org_owner_wesite%}/g,
                sign?.org_owner_wesite || ""
              )
              .replace(
                /{%org_owner_company_address%}/g,
                sign?.org_owner_company_address || ""
              );
          }
          if (sign) {
            const delimiterPattern = /\{\{%(.*?)%\}\}/g;

            emailTemplate = emailTemplate.replace(
              delimiterPattern,
              (_, rawKey) => {
                // clean up the key (remove hidden characters, trim spaces)
                const key = rawKey.replace(/[^\x20-\x7E]/g, "").trim();

                // return the replacement if found, otherwise keep the original placeholder
                return Object.prototype.hasOwnProperty.call(sign, key)
                  ? String(sign[key] ?? "")
                  : `{{%${key}%}}`; // leave as-is if no value found
              }
            );
          }

          try {
            await sendEmail(
              email_service,
              email_name,
              email_token,
              email,
              emailSubject,
              emailTemplate,
              customer_id,
              attachments,
              "",
              from_name
            );
          } catch (emailError) {
            console.error(
              `Failed to send email to ${email}:`,
              emailError.message
            );
          }
        }

        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: tempHtmlPath,
            })
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean up temporary HTML:",
            cleanupError.message
          );
        }

        await createLog(
          {
            trigger_event: "E_sign Process Completed ",
            message_id: msg_id,
            email: rec_email,
          },
          { req }
        );

        // 8. Update message status
        await Message.updateOne(
          { uid: msg_id, expired: false },
          {
            $set: {
              status: "sign completed",
              "message_custom_data.path": filePath,
            },
            $push: {
              response: {
                created_at: new Date(),
                action: action,
                data: file_name,
                link: filePath,
              },
              statusHistory: {
                status: "signed_successfully",
                datetime: new Date(),
                action: "E-sign",
              },
            },
          }
        );

        const apiKey = foundMessage.message_custom_data.app_api_key;

        const requestBody = {
          esigned_document: filePath,
          all_links_to_esign: "",
        };

        const final_body = {
          properties: requestBody,
        };
        const response = await axios({
          method: "PATCH",
          url: foundMessage.message_custom_data.doc_url,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          data: final_body,
        });

        return res.json({
          message: "Document processed successfully",
          status: "complete",
        });
      } catch (error) {
        console.error("Error in processCompleteSignatures:", error);
        if (!res.headersSent) {
          return res.status(500).json({
            message: `Error processing document: ${error.message}`,
          });
        }
      }
    }
    // **Complete A3 Size Function to generate professional audit trail page**
    function generateAuditTrailPage(auditLogs, foundMessage) {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        });
      };

      const parseDeviceDetails = (deviceDetails) => {
        try {
          const details = JSON.parse(deviceDetails);
          return {
            userAgent: details.userAgent || "Unknown",
            browser: details.userAgent?.includes("Chrome")
              ? "Google Chrome"
              : details.userAgent?.includes("Firefox")
                ? "Mozilla Firefox"
                : details.userAgent?.includes("Safari")
                  ? "Safari"
                  : details.userAgent?.includes("Edge")
                    ? "Microsoft Edge"
                    : "Unknown Browser",
            platform: details.platform?.replace(/"/g, "") || "Unknown Platform",
            mobile: details.mobile || "Unknown",
            acceptLanguage: details.acceptLanguage || "Not specified",
            acceptEncoding: details.acceptEncoding || "Not specified",
            connection: details.connection || "Not specified",
            host: details.host || "Not specified",
            referer: details.referer || "Direct access",
            origin: details.origin || "Not specified",
          };
        } catch {
          return {
            userAgent: "Unknown",
            browser: "Unknown",
            platform: "Unknown",
            mobile: "Unknown",
            acceptLanguage: "Unknown",
            acceptEncoding: "Unknown",
            connection: "Unknown",
            host: "Unknown",
            referer: "Unknown",
            origin: "Unknown",
          };
        }
      };

      const parseLocationDetails = (locationDetails) => {
        try {
          const location = JSON.parse(locationDetails);
          return {
            ip: location.ip || "Unknown",
            version: location.version || "Unknown",
            reserved: location.reserved || false,
            error: location.error || false,
            reason: location.reason || "N/A",
          };
        } catch {
          return {
            ip: "Unknown",
            version: "Unknown",
            reserved: false,
            error: false,
            reason: "N/A",
          };
        }
      };

      // Group logs by email and calculate statistics
      const logsByEmail = auditLogs.reduce((acc, log) => {
        const email = log.email || "System";
        if (!acc[email]) acc[email] = [];
        acc[email].push(log);
        return acc;
      }, {});

      // Generate participant summary with detailed information
      const participantSummary = Object.keys(logsByEmail).map((email) => {
        const userLogs = logsByEmail[email];
        const linkSentEvent = userLogs.find(
          (log) => log.trigger_event === "Link Sent Event"
        );
        const linkOpenEvents = userLogs.filter(
          (log) => log.trigger_event === "Link Open Event"
        );
        const signEvent = userLogs.find(
          (log) => log.trigger_event === "E_Sign Event"
        );
        const completedEvent = userLogs.find(
          (log) => log.trigger_event === "E_sign Process Completed"
        );
        const resultPageEvents = userLogs.filter(
          (log) => log.trigger_event === "Result Page Event"
        );

        return {
          email,
          status: completedEvent
            ? "Completed"
            : signEvent
              ? "Signed"
              : linkOpenEvents.length > 0
                ? "Viewed"
                : "Sent",
          linkSentAt: linkSentEvent
            ? formatDate(linkSentEvent.creation_time)
            : null,
          firstOpenedAt:
            linkOpenEvents.length > 0
              ? formatDate(linkOpenEvents[0].creation_time)
              : null,
          totalOpens: linkOpenEvents.length,
          signedAt: signEvent ? formatDate(signEvent.creation_time) : null,
          completedAt: completedEvent
            ? formatDate(completedEvent.creation_time)
            : null,
          resultPageViews: resultPageEvents.length,
          totalEvents: userLogs.length,
        };
      });

      // Calculate document statistics
      const documentStats = {
        totalEvents: auditLogs.length,
        totalParticipants: Object.keys(logsByEmail).length,
        completedSignatures: participantSummary.filter(
          (p) => p.status === "Completed"
        ).length,
        pendingSignatures: participantSummary.filter(
          (p) => p.status !== "Completed"
        ).length,
        firstActivity:
          auditLogs.length > 0 ? formatDate(auditLogs[0].creation_time) : "N/A",
        lastActivity:
          auditLogs.length > 0
            ? formatDate(auditLogs[auditLogs.length - 1].creation_time)
            : "N/A",
      };

      return `
    <style>
      @page {
        size: A3;
        margin: 15mm;
      }
      @media print {
        .audit-trail-page {
          width: 310mm !important;
          max-width: 310mm !important;
          font-size: 11pt !important;
        }
      }
    </style>
    
    <div class="audit-trail-page" style="
      page-break-before: always;
      padding: 15mm;
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: white;
      color: black;
      font-size: 11pt;
      line-height: 1.5;
      width: 310mm;
      min-height: 420mm;
      max-width: 310mm;
      box-sizing: border-box;
    ">
      
      <!-- Header Section -->
      <div style="
        border: 2px solid black;
        padding: 15px;
        margin-bottom: 20px;
        text-align: center;
      ">
        <h1 style="
          margin: 0 0 10px 0;
          font-size: 22pt;
          font-weight: bold;
          color: #DC143C;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">DIGITAL SIGNATURE AUDIT TRAIL</h1>
        <p style="margin: 0; font-size: 13pt; color: black;">
          Complete Activity Log and Verification Record
        </p>
        <div style="
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 10pt;
          color: #666;
        ">
          Generated on: ${formatDate(new Date())}
        </div>
      </div>

      <!-- Document Information -->
      <div style="margin-bottom: 20px;">
        <h2 style="
          margin: 0 0 12px 0;
          font-size: 16pt;
          font-weight: bold;
          color: #DC143C;
          border-bottom: 2px solid #DC143C;
          padding-bottom: 6px;
        ">DOCUMENT INFORMATION</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="width: 25%; padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Document ID:</td>
            <td style="padding: 10px; border: 1px solid black; font-family: monospace;">${foundMessage?.uid || "N/A"
        }</td>
            <td style="width: 25%; padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Message ID:</td>
            <td style="padding: 10px; border: 1px solid black; font-family: monospace;">${foundMessage?.message_id || "N/A"
        }</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Recipient Email:</td>
            <td style="padding: 10px; border: 1px solid black;">${foundMessage?.recipient_email || "N/A"
        }</td>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Status:</td>
            <td style="padding: 10px; border: 1px solid black; color: ${foundMessage?.status === "sign completed" ? "#DC143C" : "black"
        }; font-weight: bold;">
              ${foundMessage?.status || "N/A"}
            </td>
          </tr>
        </table>
      </div>

      <!-- Document Statistics -->
      <div style="margin-bottom: 20px;">
        <h2 style="
          margin: 0 0 12px 0;
          font-size: 16pt;
          font-weight: bold;
          color: #DC143C;
          border-bottom: 2px solid #DC143C;
          padding-bottom: 6px;
        ">DOCUMENT STATISTICS</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="width: 25%; padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Total Events:</td>
            <td style="width: 25%; padding: 10px; border: 1px solid black;">${documentStats.totalEvents
        }</td>
            <td style="width: 25%; padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Total Participants:</td>
            <td style="width: 25%; padding: 10px; border: 1px solid black;">${documentStats.totalParticipants
        }</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Completed Signatures:</td>
            <td style="padding: 10px; border: 1px solid black; color: ${documentStats.completedSignatures > 0 ? "#DC143C" : "black"
        }; font-weight: bold;">
              ${documentStats.completedSignatures}
            </td>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Pending Signatures:</td>
            <td style="padding: 10px; border: 1px solid black;">${documentStats.pendingSignatures
        }</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">First Activity:</td>
            <td style="padding: 10px; border: 1px solid black;">${documentStats.firstActivity
        }</td>
            <td style="padding: 10px; border: 1px solid black; background: #f5f5f5; font-weight: bold;">Last Activity:</td>
            <td style="padding: 10px; border: 1px solid black;">${documentStats.lastActivity
        }</td>
          </tr>
        </table>
      </div>

      <!-- Participants Summary -->
      <div style="margin-bottom: 20px;">
        <h2 style="
          margin: 0 0 12px 0;
          font-size: 16pt;
          font-weight: bold;
          color: #DC143C;
          border-bottom: 2px solid #DC143C;
          padding-bottom: 6px;
        ">PARTICIPANTS SUMMARY</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; border: 1px solid black; font-weight: bold; text-align: left;">Participant Email</th>
              <th style="padding: 10px; border: 1px solid black; font-weight: bold; text-align: center;">Status</th>
              <th style="padding: 10px; border: 1px solid black; font-weight: bold; text-align: center;">Opens</th>
              <th style="padding: 10px; border: 1px solid black; font-weight: bold; text-align: center;">Events</th>
              <th style="padding: 10px; border: 1px solid black; font-weight: bold; text-align: left;">Completion Time</th>
            </tr>
          </thead>
          <tbody>
            ${participantSummary
          .map(
            (participant) => `
              <tr>
                <td style="padding: 10px; border: 1px solid black;">${participant.email
              }</td>
                <td style="padding: 10px; border: 1px solid black; text-align: center; color: ${participant.status === "Completed" ? "#DC143C" : "black"
              }; font-weight: ${participant.status === "Completed" ? "bold" : "normal"
              };">
                  ${participant.status}
                </td>
                <td style="padding: 10px; border: 1px solid black; text-align: center;">${participant.totalOpens
              }</td>
                <td style="padding: 10px; border: 1px solid black; text-align: center;">${participant.totalEvents
              }</td>
                <td style="padding: 10px; border: 1px solid black; font-size: 10pt;">
                  ${participant.completedAt ||
              participant.signedAt ||
              "Not completed"
              }
                </td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>

      <!-- Detailed Activity Timeline -->
      <div style="margin-bottom: 20px;">
        <h2 style="
          margin: 0 0 12px 0;
          font-size: 16pt;
          font-weight: bold;
          color: #DC143C;
          border-bottom: 2px solid #DC143C;
          padding-bottom: 6px;
        ">DETAILED ACTIVITY TIMELINE</h2>
        
        ${auditLogs
          .map((log, index) => {
            const device = parseDeviceDetails(log.device_details || "{}");
            const location = parseLocationDetails(log.location || "{}");

            return `
            <div style="
              margin-bottom: 15px;
              border: 1px solid black;
              background: ${index % 2 === 0 ? "#fafafa" : "white"};
            ">
              <!-- Event Header -->
              <div style="
                padding: 10px;
                background: #f5f5f5;
                border-bottom: 1px solid black;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: #DC143C; font-size: 13pt;">${log.trigger_event
              }</strong>
                    ${log.email
                ? `<br><span style="font-size: 10pt; color: #666;">Participant: ${log.email}</span>`
                : ""
              }
                  </div>
                  <div style="text-align: right; font-size: 10pt;">
                    <div><strong>Event #${index + 1}</strong></div>
                    <div>${formatDate(log.creation_time)}</div>
                  </div>
                </div>
              </div>
              
              <!-- Event Details -->
              <div style="padding: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 20%; padding: 6px; font-weight: bold; color: #666;">Event ID:</td>
                    <td style="width: 30%; padding: 6px; font-family: monospace; font-size: 9pt;">${log._id
              }</td>
                    <td style="width: 20%; padding: 6px; font-weight: bold; color: #666;">Message ID:</td>
                    <td style="width: 30%; padding: 6px; font-family: monospace; font-size: 9pt;">${log.message_id
              }</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">IP Address:</td>
                    <td style="padding: 6px; font-family: monospace;">${location.ip
              }</td>
                    <td style="padding: 6px; font-weight: bold; color: #666;">IP Version:</td>
                    <td style="padding: 6px;">${location.version}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Browser:</td>
                    <td style="padding: 6px;">${device.browser}</td>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Platform:</td>
                    <td style="padding: 6px;">${device.platform}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Device Type:</td>
                    <td style="padding: 6px;">${log.device_type}</td>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Host:</td>
                    <td style="padding: 6px; font-family: monospace; font-size: 9pt;">${device.host
              }</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Referer:</td>
                    <td style="padding: 6px; font-size: 9pt;" colspan="3">${device.referer
              }</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">User Agent:</td>
                    <td style="padding: 6px; font-size: 9pt; font-family: monospace;" colspan="3">${device.userAgent
              }</td>
                  </tr>
                </table>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>

      <!-- Signature Details (if available) -->
      ${foundMessage?.signatures && foundMessage.signatures.length > 0
          ? `
        <div style="margin-bottom: 20px;">
          <h2 style="
            margin: 0 0 12px 0;
            font-size: 16pt;
            font-weight: bold;
            color: #DC143C;
            border-bottom: 2px solid #DC143C;
            padding-bottom: 6px;
          ">SIGNATURE DETAILS</h2>
          
          ${foundMessage.signatures
            .map(
              (signature, index) => `
            <div style="margin-bottom: 15px; border: 1px solid black; padding: 10px;">
              <h3 style="margin: 0 0 10px 0; color: #DC143C; font-size: 14pt;">Signer ${index + 1
                }: ${signature.email}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 25%; padding: 6px; font-weight: bold; color: #666;">Email:</td>
                  <td style="width: 75%; padding: 6px;">${signature.email}</td>
                </tr>
                ${signature.entries
                  ? signature.entries
                    .map(
                      (entry) => `
                  <tr>
                    <td style="padding: 6px; font-weight: bold; color: #666;">Field (${entry.target_id
                        }):</td>
                    <td style="padding: 6px;">${entry.target_type === "sign"
                          ? "Digital Signature Applied"
                          : entry[entry.target_id] || "N/A"
                        }</td>
                  </tr>
                `
                    )
                    .join("")
                  : ""
                }
              </table>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
        }

      <!-- Footer -->
      <div style="
        margin-top: 30px;
        padding: 15px;
        border: 2px solid black;
        text-align: center;
        background: #f5f5f5;
      ">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #DC143C; font-size: 14pt;">
          AUDIT TRAIL VERIFICATION
        </p>
        <p style="margin: 0; font-size: 10pt; color: black;">
          This audit trail provides a complete and tamper-evident record of all digital signature activities.<br>
          All timestamps are recorded in UTC and converted to local time for display.<br>
          This document is generated automatically for compliance and legal verification purposes.
        </p>
        <div style="margin-top: 10px; font-size: 9pt; color: #666;">
          Document Hash: ${foundMessage?.uid || "N/A"
        } | Generated: ${formatDate(new Date())}
        </div>
      </div>
    </div>
  `;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error uploading files to S3" });
  }
};

module.exports = {
  S3Upload: S3Upload,
};
