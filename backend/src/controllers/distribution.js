const Message = require("../models/model").Message;
const EmailTemp = require("../models/model").emailtemp;
const Customer = require("../models/model").Customer;
const User = require("../models/model").User;
const sendSMS = require("../Libs/clicksendsms");
const sendEmail = require("../Libs/sendemail");
const sendEmail2 = require("../Libs/sendemail2");
const generateShortURL = require("../Libs/urlshortner");
const crypto = require("crypto");
const counter = require("../Libs/counter");
const config = require("../../config/environment/dbDependencies");
const jwt = require("jsonwebtoken");
const status_code = require("../Libs/constants");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Dropbox } = require("dropbox");
const { google } = require("googleapis");
const stream = require("stream");
const { refreshDropboxAccessToken } = require("../Libs/cron");
const axios = require("axios");
const { createLog } = require("./log");

function base64ToBuffer(base64String) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
}

async function uploadDiagramImages(
  diagramContent,
  customerId,
  messageId,
  recipientName
) {
  try {
    const customer = await Customer.findOne({ uid: customerId });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const fileConfigs = customer.get("file_configuration");
    if (!Array.isArray(fileConfigs) || fileConfigs.length === 0) {
      throw new Error("No file configuration found for this customer");
    }

    // Get first available file service configuration
    const fileConfig = fileConfigs[0]; // You might want to implement logic to choose specific service
    const service = fileConfig.service_name;

    const uploadResults = [];

    for (const diagram of diagramContent) {
      if (!diagram.url || !diagram.name) continue;

      // Convert base64 to buffer
      const fileBuffer = base64ToBuffer(diagram.url);
      const fileName = `${diagram.name}_${Date.now()}.jpg`;

      if (service === "S3") {
        const s3Client = new S3Client({
          region: fileConfig.region,
          credentials: {
            accessKeyId: fileConfig.access_key,
            secretAccessKey: fileConfig.secret_key,
          },
        });

        const folderName = `service_diagrams_${messageId}`;
        const uploadParams = {
          Bucket: fileConfig.bucket_name,
          Key: `${folderName}/${fileName}`,
          Body: fileBuffer,
          ContentType: "image/jpeg",
        };

        const uploadResult = await s3Client.send(
          new PutObjectCommand(uploadParams)
        );
        const publicUrl = `https://${fileConfig.bucket_name}.s3.${fileConfig.region}.amazonaws.com/${folderName}/${fileName}`;

        uploadResults.push({
          name: diagram.name,
          url: publicUrl,
        });
      } else if (service === "Dropbox") {
        const accessToken = fileConfig.access_key.trim();
        const dbx = new Dropbox({ accessToken: accessToken });

        try {
          const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${recipientName}/ServiceDiagrams`;
          try {
            await dbx.filesCreateFolderV2({ path: folderPath });
          } catch (error) {
            if (error.status !== 409) {
              console.error("Error creating folder:", error);
            }
          }

          const uploadResponse = await dbx.filesUpload({
            path: `${folderPath}/${fileName}`,
            contents: fileBuffer,
          });

          const sharedLinkResponse =
            await dbx.sharingCreateSharedLinkWithSettings({
              path: uploadResponse.result.path_lower,
              settings: {
                requested_visibility: "public",
              },
            });

          // Convert standard Dropbox shared link to direct download link
          let directUrl = sharedLinkResponse.result.url.replace(
            "www.dropbox.com",
            "dl.dropboxusercontent.com"
          );
          directUrl = directUrl.replace("?dl=0", "");

          uploadResults.push({
            name: diagram.name,
            url: directUrl,
          });
        } catch (error) {
          // Try refreshing token if expired
          if (error.status === 401) {
            await refreshDropboxAccessToken(customer);
            throw new Error(
              "Dropbox token refreshed, please retry the operation"
            );
          }
          throw error;
        }
      } else if (service === "GoogleDrive") {
        const credentials = {
          clientId: fileConfig.client_id,
          clientSecret: fileConfig.secret_id,
          redirectUri: fileConfig.redirect_uri,
        };

        const auth = new google.auth.OAuth2(credentials);
        auth.setCredentials({
          refresh_token: fileConfig.refresh_token,
        });

        const drive = google.drive({ version: "v3", auth });

        // Create folder for diagrams
        let folderId;
        const folderName = `ServiceDiagrams_${messageId}`;

        const folderResponse = await drive.files.list({
          q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
          fields: "files(id)",
        });

        if (folderResponse.data.files.length > 0) {
          folderId = folderResponse.data.files[0].id;
        } else {
          const createFolderResponse = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
            },
          });
          folderId = createFolderResponse.data.id;
        }

        // Upload file
        const fileContentStream = new stream.PassThrough();
        fileContentStream.end(fileBuffer);

        const fileResponse = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId],
          },
          media: {
            mimeType: "image/jpeg",
            body: fileContentStream,
          },
        });

        // Make file public
        await drive.permissions.create({
          fileId: fileResponse.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });

        const publicUrl = `https://drive.google.com/uc?export=view&id=${fileResponse.data.id}`;

        uploadResults.push({
          name: diagram.name,
          url: publicUrl,
        });
      }
    }

    return uploadResults;
  } catch (error) {
    console.error("Error uploading diagram images:", error);
    throw error;
  }
}

async function fetchSecureGatewayConfig(htmlLink) {
  try {
    const response = await fetch(htmlLink);
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML content: ${response.status}`);
    }
    const htmlContent = await response.text();
    const $ = cheerio.load(htmlContent);
    const configElement = $("#SecureGateway_Configuration");

    if (!configElement.length) {
      throw new Error("SecureGateway_Configuration element not found in HTML");
    }
    const configString = configElement.attr("data-config");
    if (!configString) {
      const scripts = $("script");
      let configFound = false;

      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const scriptContent = $(script).html();

        if (scriptContent.includes("secureGatewayConfig")) {
          const configMatch = scriptContent.match(
            /secureGatewayConfig\s*=\s*(\{[\s\S]*?\})\s*;/
          );

          if (configMatch && configMatch[1]) {
            try {
              const configObj = new Function(`return ${configMatch[1]}`)();
              return configObj;
            } catch (evalError) {
              console.error("Error parsing config from script:", evalError);
            }
          }
        }
      }
      if (!configFound) {
        throw new Error(
          "SecureGateway configuration not found in data-config attribute or scripts"
        );
      }
    }
    return JSON.parse(configString);
  } catch (error) {
    console.error("Error fetching SecureGateway configuration:", error);
    throw error;
  }
}

const createMessage = async (req, res) => {
  const handleRequest = async () => {
    const requestData = req.body;
    const email = [];
    const sms = [];
    const data = [];
    const { token } = req.params;
    const { secret_key } = req.query;
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
    const type = "credit_counts";

    if (!token) {
      return res.status(400).json({ error: "Token is mandatory" });
    }
    if (!secret_key) {
      return res.status(400).json({ error: "Key is mandatory" });
    }

    try {
      const decodedToken = jwt.verify(secret_key, status_code.SF_SECRET_KEY);
      if (!decodedToken) {
        return res
          .status(status_code.UNAUTHORIZED_STATUS)
          .json({ error: "Invalid Secret Key" });
      }
      if (
        decodedToken.exp &&
        decodedToken.exp < Math.floor(Date.now() / 1000)
      ) {
        return res
          .status(status_code.UNAUTHORIZED_STATUS)
          .json({ error: "Expired Secret Key" });
      }
    } catch (error) {
      return res.status(400).json({ error: "Illegal Access" });
    }

    if (!requestData.action) {
      return res.status(400).json({ error: "Action is mandatory" });
    }

    if (!requestData.otp_page) {
      return res.status(400).json({ error: "Otp Page is mandatory" });
    }

    const user = await Customer.findOne({ token: token });

    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const customer_id = user.uid;

    const valid_cus = await User.findOne({ user_uid: customer_id });

    if (valid_cus.credits === 0) {
      return res.status(400).json({
        error: "No credits available. Customer Need To recharge This Account",
      });
    }

    const pageConfig = user.page_configuration.find(
      (config) => config.action === requestData.action
    );

    if (!pageConfig) {
      return res
        .status(400)
        .json({ error: "Page configuration not found for the action" });
    }

    if (requestData.msg_service.includes("sms")) {
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

    if (requestData.msg_service.includes("email")) {
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
      if (requestData.action === "Sbho_Link") {
        for (const recipient of requestData.recipients) {
          const existingMessage = await Message.findOne({
            customer_id: user.uid,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
          });

          if (existingMessage) {
            const filter = {
              customer_id: user.uid,
              recipient_originalid: recipient.Original_id,
              message_externalid: requestData.message_id,
            };
            const excludedKeys = [
              "recipients",
              "message_id",
              "action",
              "msg_service",
              "file_service",
            ];
            const updateData = {};

            updateData.message_custom_data = {};
            for (const key in requestData) {
              if (!excludedKeys.includes(key)) {
                updateData.message_custom_data[key] = requestData[key];
              }
            }
            updateData.signatures = [];
            const options = {
              new: true,
            };
            const updatedMessage = await Message.findOneAndUpdate(
              filter,
              updateData,
              options
            );
            if (!updatedMessage) {
              return res
                .status(400)
                .json({ error: "Failed to update message" });
            }
            const shortenLink = updatedMessage.shorten_link.find(
              (link) => link.action === "Sbho_Link"
            );
            if (shortenLink && shortenLink.url) {
              data.push(shortenLink.url);
            } else {
              data.push("Message Updated Successfully");
            }
            continue;
          }

          const NewUid = crypto.randomBytes(16).toString("hex");
          const replacedURL = pageConfig.url
            .replace("{%action%}", pageConfig.action)
            .replace("{%uid%}", NewUid)
            .replace("{%template%}", pageConfig.template);
          const urlParam = `${replacedURL}?source=${requestData.msg_service}?otp_page=${requestData.otp_page}`;

          const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
          try {
            const api_keys = user.applnx_api_keys;
            const url_response = await generateShortURL(
              api_keys,
              signature,
              urlParam
            );
            if (!url_response) {
              return res
                .status(400)
                .json({ error: "Failed to retrieve ShortUrl" });
            }
            shorturl = url_response;
          } catch (error) {
            return res
              .status(400)
              .json({ error: "Failed to retrieve ShortUrl" });
          }

          const newMessageData = {
            uid: NewUid,
            customer_id: user.uid,
            recipient_externalid: recipient.id,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
            action: requestData.action,
            recipient_email: recipient.email,
            recipient_mobile: recipient.mobile,
            recipient_name: recipient.name,
            msg_service: requestData.msg_service,
            file_service: requestData.file_service,
            status: "New",
            otp_page: requestData.otp_page,
            expired: false,
            expired_date: new Date(),
            shorten_link: [
              {
                action: requestData.action,
                url: shorturl,
              },
            ],
            response: [],
            message_custom_data: {
              status: "Draft",
            },
          };

          for (const key in requestData) {
            if (
              key !== "recipients" &&
              key !== "message_id" &&
              key !== "action" &&
              key !== "msg_service" &&
              key !== "file_service" &&
              key !== "otp_page"
            ) {
              newMessageData.message_custom_data[key] = requestData[key];
            }
          }

          const newMessage = new Message(newMessageData);
          await newMessage.save();

          if (newMessage) {
            await counter(customer_id, type);
            await User.updateOne(
              { user_uid: customer_id },
              { $inc: { credits: -1 } }
            );
            data.push(shorturl);
          }
        }
      } else if (
        requestData.action === "Ajm_Link" ||
        requestData.action === "Bwd_Quote"
      ) {
        let Temp_name;
        if (requestData.Ajm_Data) {
          Temp_name = "AJM_QUOTE";
        }
        if (requestData.Bwd_Quote) {
          Temp_name = "BWD_QUOTE";
        }
        if (requestData.Bwd_Esign) {
          Temp_name = "BWD_ESIGN";
        }

        const email_data = await EmailTemp.findOne({ templateName: Temp_name });
        if (!email_data) {
          return res
            .status(400)
            .json({ error: "Email Template Not Found For the Paylaod" });
        }

        for (const recipient of requestData.recipients) {
          let uploadedDiagrams = [];

          if (
            requestData.action === "Bwd_Esign" &&
            requestData.Bwd_Esign &&
            requestData.Bwd_Esign.Quote_items
          ) {
            for (const quoteItem of requestData.Bwd_Esign.Quote_items) {
              if (quoteItem.item && quoteItem.item.sections) {
                const serviceDiagramSection = quoteItem.item.sections.find(
                  (section) =>
                    section.sectionNumber === 7 &&
                    section.content.content &&
                    Array.isArray(section.content.content)
                );

                if (
                  serviceDiagramSection &&
                  serviceDiagramSection.content.content.length > 0
                ) {
                  try {
                    const diagramResults = await uploadDiagramImages(
                      serviceDiagramSection.content.content,
                      user.uid,
                      requestData.message_id,
                      recipient.name
                    );
                    uploadedDiagrams = diagramResults;
                    for (
                      let i = 0;
                      i < serviceDiagramSection.content.content.length;
                      i++
                    ) {
                      if (i < diagramResults.length) {
                        serviceDiagramSection.content.content[i].url =
                          diagramResults[i].url;
                      }
                    }
                  } catch (error) {
                    console.error("Error processing service diagrams:", error);
                    return res.status(500).json({
                      error: `Failed to process service diagrams: ${error.message}`,
                    });
                  }
                }
              }
            }
          }

          if (
            requestData.action === "Bwd_Esign" &&
            requestData.Bwd_Esign &&
            requestData.Bwd_Esign.Quote_items
          ) {
            for (const quoteItem of requestData.Bwd_Esign.Quote_items) {
              if (quoteItem.item && quoteItem.item.sections) {
                const serviceDiagramSection = quoteItem.item.sections.find(
                  (section) =>
                    section.sectionNumber === 7 &&
                    section.content.content &&
                    Array.isArray(section.content.content)
                );
                if (
                  serviceDiagramSection &&
                  serviceDiagramSection.content.length > 0
                ) {
                  for (
                    let i = 0;
                    i < serviceDiagramSection.content.content.length;
                    i++
                  ) {
                    const diagramItem =
                      serviceDiagramSection.content.content[i];
                    if (diagramItem && diagramItem.url) {
                      const uploadedDiagram = uploadedDiagrams.find(
                        (diagram) => diagram.name === diagramItem.name
                      );

                      if (uploadedDiagram && uploadedDiagram.url) {
                        diagramItem.url = uploadedDiagram.url;
                      }
                    }
                  }
                }
              }
            }
          }

          const existingMessage = await Message.findOne({
            customer_id: user.uid,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
            action: requestData.action,
          });
          if (
            existingMessage &&
            existingMessage.signatures &&
            existingMessage.signatures.length > 0
          ) {
            return res
              .status(200)
              .json({ message: "Recipient Has Already Agreed The Quote" });
          }
          if (existingMessage) {
            console.log(requestData.preview);
            const filter = {
              customer_id: user.uid,
              recipient_originalid: recipient.Original_id,
              message_externalid: requestData.message_id,
            };
            const excludedKeys = [
              "recipients",
              "message_id",
              "action",
              "msg_service",
              "file_service",
            ];
            const updateData = {};
            for (const key in requestData) {
              if (!excludedKeys.includes(key)) {
                updateData[`message_custom_data.${key}`] = requestData[key];
                updateData[`is_readable`] = requestData.preview;
              }
            }
            const options = {
              new: true,
            };
            const updatedMessage = await Message.findOneAndUpdate(
              filter,
              updateData,
              options
            );
            if (!updatedMessage) {
              return res
                .status(400)
                .json({ error: "Failed to update message" });
            }

            const shortenLink = updatedMessage.shorten_link.find(
              (link) => link.action === requestData.action
            );
            if (shortenLink && shortenLink.url) {
              const sign = requestData.email_sign_details;
              data.push({
                link: shortenLink.url,
                message: "Message Updated Successfully",
              });

              let emailTemplate =
                requestData.email_body && requestData.email_body.trim() !== ""
                  ? requestData.email_body
                  : email_data.templateData.html;

              // Use email_subject from payload if available and not null/empty, otherwise use template subject
              const subject =
                requestData.email_subject &&
                  requestData.email_subject.trim() !== ""
                  ? requestData.email_subject
                  : email_data.subject;

              emailTemplate = emailTemplate
                .replace(/{%URL%}/g, shortenLink.url)
                .replace(/{%XXX%}/g, recipient.name);

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

              const id = requestData.message_id;
              let cc = requestData.alternate_email;
              if (requestData.preview) {
                await createLog(
                  {
                    trigger_event: "Data Update Event",
                    message_id: requestData.message_id,
                    email: recipient.email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: updatedMessage.uid, expired: false },
                  {
                    $set: { status: "updation" },
                    $push: {
                      statusHistory: {
                        status: "data_updated",
                        datetime: new Date(),
                        action: requestData.action,
                      },
                    },
                  }
                );
              } else {
                await createLog(
                  {
                    trigger_event: "Link Resend Event",
                    message_id: requestData.message_id,
                    email: recipient.email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: updatedMessage.uid, expired: false },
                  {
                    $set: { status: "resend" },
                    $push: {
                      statusHistory: {
                        status: "link_resend",
                        datetime: new Date(),
                        action: requestData.action,
                      },
                    },
                  }
                );
                await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  recipient.email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
              }
            } else {
              data.push("Message Updated Successfully");
            }
            continue;
          }

          const NewUid = crypto.randomBytes(16).toString("hex");
          const replacedURL = pageConfig.url
            .replace("{%action%}", pageConfig.action)
            .replace("{%uid%}", NewUid)
            .replace("{%template%}", pageConfig.template);
          const urlParam = `${replacedURL}?source=${requestData.msg_service}?otp_page=${requestData.otp_page}`;

          const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
          try {
            const api_keys = user.applnx_api_keys;
            const url_response = await generateShortURL(
              api_keys,
              signature,
              urlParam
            );
            if (!url_response) {
              return res
                .status(400)
                .json({ error: "Failed to retrieve ShortUrl" });
            }
            shorturl = url_response;
          } catch (error) {
            return res
              .status(400)
              .json({ error: "Failed to retrieve ShortUrl" });
          }

          const newMessageData = {
            uid: NewUid,
            customer_id: user.uid,
            recipient_externalid: recipient.id,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
            action: requestData.action,
            recipient_email: recipient.email,
            recipient_mobile: recipient.mobile,
            email_sign_details: requestData.email_sign_details,
            sharepoint_folder_path: requestData.sharepoint_folder_path,
            sharepoint_filename: requestData.sharepoint_filename,
            recipient_name: recipient.name,
            msg_service: requestData.msg_service,
            file_service: requestData.file_service,
            status: "New",
            alternate_email: requestData.alternate_email,
            otp_page: requestData.otp_page,
            is_readable: requestData.preview || false,
            expired: false,
            expired_date: new Date(),
            smsmessage: [
              {
                action: requestData.action,
                content: pageConfig.SMS_Content
                  ? pageConfig.SMS_Content.replace("{%URL%}", shorturl).replace(
                    "{%XXX%}",
                    recipient.name
                  )
                  : "",
                created_at: new Date(),
              },
            ],

            emailmessage: [
              {
                action: requestData.action,
                content: pageConfig
                  .get("EMAIL_Content")
                  .replace("{%URL%}", shorturl)
                  .replace("{%XXX%}", recipient.name),
                created_at: new Date(),
              },
            ],
            shorten_link: [
              {
                action: requestData.action,
                url: shorturl,
              },
            ],
            response: [],
            statusHistory: [
              {
                status: "created",
                datetime: new Date(),
                action: requestData.action,
              },
            ],
            message_custom_data: {
              status: "Draft",
              no_of_signs: "1",
            },
          };

          await createLog(
            {
              trigger_event: "Record Created Event",
              message_id: NewUid,
              email: recipient.email,
            },
            { req }
          );

          for (const key in requestData) {
            if (
              key !== "recipients" &&
              key !== "message_id" &&
              key !== "action" &&
              key !== "msg_service" &&
              key !== "file_service" &&
              key !== "otp_page"
            ) {
              newMessageData.message_custom_data[key] = requestData[key];
            }
          }

          const newMessage = new Message(newMessageData);
          await newMessage.save();

          if (newMessage) {
            if (newMessage.msg_service.includes("sms")) {
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
                sms.push({
                  error: `Failed to send SMS to ${recipient.mobile}`,
                });
              }
            }
            if (newMessage.msg_service.includes("email")) {
              const sign = requestData.email_sign_details;

              let emailTemplate =
                requestData.email_body && requestData.email_body.trim() !== ""
                  ? requestData.email_body
                  : email_data.templateData.html;

              // Use email_subject from payload if available and not null/empty, otherwise use template subject
              const subject =
                requestData.email_subject &&
                  requestData.email_subject.trim() !== ""
                  ? requestData.email_subject
                  : email_data.subject;

              emailTemplate = emailTemplate
                .replace(/{%URL%}/g, shorturl)
                .replace(/{%XXX%}/g, newMessage.recipient_name);

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
              const id = requestData.message_id;
              let cc = requestData.alternate_email;

              if (requestData.preview) {
                const emailResponse = await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  newMessage.recipient_email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
                if (
                  emailResponse &&
                  emailResponse.response &&
                  emailResponse.response.startsWith("250")
                ) {
                  emailSuccess = true;
                  email.push(
                    `Email has been sent successfully to ${newMessage.recipient_email}`
                  );
                } else if (emailResponse && emailResponse.error) {
                  email.push({
                    error: `Failed to send emailto ${newMessage.recipient_email}`,
                  });
                } else {
                  email.push({
                    error: "Failed to send email: Unexpected response",
                  });
                }
              } else {
                const emailResponse = await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  newMessage.recipient_email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
                if (
                  emailResponse &&
                  emailResponse.response &&
                  emailResponse.response.startsWith("250")
                ) {
                  emailSuccess = true;
                  email.push(
                    `Email has been sent successfully to ${newMessage.recipient_email}`
                  );
                } else if (emailResponse && emailResponse.error) {
                  email.push({
                    error: `Failed to send emailto ${newMessage.recipient_email}`,
                  });
                } else {
                  email.push({
                    error: "Failed to send email: Unexpected response",
                  });
                }
              }
            }
            if (requestData.preview) {
              data.push({
                message: `Preview Link For ${newMessage.recipient_name}`,
                link: shorturl,
              });
            } else {
              if (smsSuccess || emailSuccess) {
                await createLog(
                  {
                    trigger_event: "Link Sent Event",
                    message_id: newMessage.uid,
                    email: newMessage.recipient_email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: newMessage.uid, expired: false },
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
                data.push({
                  message: `Link Distributed successfully For ${newMessage.recipient_name}`,
                  link: shorturl,
                });
              }
            }

            await counter(customer_id, type);
            await User.updateOne(
              { user_uid: customer_id },
              { $inc: { credits: -1 } }
            );
          }
        }
      } else if (
        requestData.action === "Bwd_Esign" ||
        requestData.action === "Ajm_Insurance_Esign"
      ) {
        let Temp_name;

        if (requestData.Bwd_Esign) {
          Temp_name = "BWD_ESIGN";
        }
        if (requestData.Ajm_Insurance_Esign) {
          Temp_name = "AJM_QUOTE";
        }

        const email_data = await EmailTemp.findOne({ templateName: Temp_name });
        if (!email_data) {
          return res
            .status(400)
            .json({ error: "Email Template Not Found For the Paylaod" });
        }

        for (const recipient of requestData.recipients) {
          let uploadedDiagrams = [];

          if (
            requestData.action === "Bwd_Esign" &&
            requestData.Bwd_Esign &&
            requestData.Bwd_Esign.Quote_items
          ) {
            for (const quoteItem of requestData.Bwd_Esign.Quote_items) {
              if (quoteItem.item && quoteItem.item.sections) {
                const serviceDiagramSection = quoteItem.item.sections.find(
                  (section) =>
                    section.sectionNumber === 7 &&
                    section.content.content &&
                    Array.isArray(section.content.content)
                );

                if (
                  serviceDiagramSection &&
                  serviceDiagramSection.content.content.length > 0
                ) {
                  try {
                    const diagramResults = await uploadDiagramImages(
                      serviceDiagramSection.content.content,
                      user.uid,
                      requestData.message_id,
                      recipient.name
                    );
                    uploadedDiagrams = diagramResults;
                    for (
                      let i = 0;
                      i < serviceDiagramSection.content.content.length;
                      i++
                    ) {
                      if (i < diagramResults.length) {
                        serviceDiagramSection.content.content[i].url =
                          diagramResults[i].url;
                      }
                    }
                  } catch (error) {
                    console.error("Error processing service diagrams:", error);
                    return res.status(500).json({
                      error: `Failed to process service diagrams: ${error.message}`,
                    });
                  }
                }
              }
            }
          }

          if (
            requestData.action === "Bwd_Esign" &&
            requestData.Bwd_Esign &&
            requestData.Bwd_Esign.Quote_items
          ) {
            for (const quoteItem of requestData.Bwd_Esign.Quote_items) {
              if (quoteItem.item && quoteItem.item.sections) {
                const serviceDiagramSection = quoteItem.item.sections.find(
                  (section) =>
                    section.sectionNumber === 7 &&
                    section.content.content &&
                    Array.isArray(section.content.content)
                );
                if (
                  serviceDiagramSection &&
                  serviceDiagramSection.content.length > 0
                ) {
                  for (
                    let i = 0;
                    i < serviceDiagramSection.content.content.length;
                    i++
                  ) {
                    const diagramItem =
                      serviceDiagramSection.content.content[i];
                    if (diagramItem && diagramItem.url) {
                      const uploadedDiagram = uploadedDiagrams.find(
                        (diagram) => diagram.name === diagramItem.name
                      );

                      if (uploadedDiagram && uploadedDiagram.url) {
                        diagramItem.url = uploadedDiagram.url;
                      }
                    }
                  }
                }
              }
            }
          }

          const existingMessage = await Message.findOne({
            customer_id: user.uid,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
            action: requestData.action,
          });
          if (
            existingMessage &&
            existingMessage.signatures &&
            existingMessage.signatures.length > 0
          ) {
            return res
              .status(200)
              .json({ message: "Recipient Has Already Agreed The Quote" });
          }
          if (existingMessage) {
            console.log(requestData.preview);
            const filter = {
              customer_id: user.uid,
              recipient_originalid: recipient.Original_id,
              message_externalid: requestData.message_id,
            };
            const excludedKeys = [
              "message_id",
              "action",
              "msg_service",
              "file_service",
            ];
            const updateData = {};
            for (const key in requestData) {
              if (!excludedKeys.includes(key)) {
                updateData[`message_custom_data.${key}`] = requestData[key];
                updateData[`is_readable`] = requestData.preview;
                updateData[`recipient_email`] = recipient.email;
              }
            }
            const options = {
              new: true,
            };
            const updatedMessage = await Message.findOneAndUpdate(
              filter,
              updateData,
              options
            );
            if (!updatedMessage) {
              return res
                .status(400)
                .json({ error: "Failed to update message" });
            }

            const shortenLink = updatedMessage.shorten_link.find(
              (link) => link.action === requestData.action
            );
            if (shortenLink && shortenLink.url) {
              const sign = requestData.email_sign_details;
              data.push({
                link: shortenLink.url,
                message: "Message Updated Successfully",
              });

              let emailTemplate =
                requestData.email_body && requestData.email_body.trim() !== ""
                  ? requestData.email_body
                  : email_data.templateData.html;

              // Use email_subject from payload if available and not null/empty, otherwise use template subject
              const subject =
                requestData.email_subject &&
                  requestData.email_subject.trim() !== ""
                  ? requestData.email_subject
                  : email_data.subject;

              emailTemplate = emailTemplate
                .replace(/{%URL%}/g, shortenLink.url)
                .replace(/{%XXX%}/g, recipient.name);

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

              const id = requestData.message_id;
              let cc = requestData.alternate_email;
              if (requestData.preview) {
                await createLog(
                  {
                    trigger_event: "Data Update Event",
                    message_id: requestData.message_id,
                    email: recipient.email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: updatedMessage.uid, expired: false },
                  {
                    $set: { status: "updation" },
                    $push: {
                      statusHistory: {
                        status: "data_updated",
                        datetime: new Date(),
                        action: requestData.action,
                      },
                    },
                  }
                );
              } else {
                await createLog(
                  {
                    trigger_event: "Link Resend Event",
                    message_id: requestData.message_id,
                    email: recipient.email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: updatedMessage.uid, expired: false },
                  {
                    $set: { status: "resend" },
                    $push: {
                      statusHistory: {
                        status: "link_resend",
                        datetime: new Date(),
                        action: requestData.action,
                      },
                    },
                  }
                );
                await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  recipient.email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
              }
            } else {
              data.push("Message Updated Successfully");
            }
            continue;
          }

          const NewUid = crypto.randomBytes(16).toString("hex");
          const replacedURL = pageConfig.url
            .replace("{%action%}", pageConfig.action)
            .replace("{%uid%}", NewUid)
            .replace("{%template%}", pageConfig.template);
          const urlParam = `${replacedURL}?source=${requestData.msg_service}?otp_page=${requestData.otp_page}`;

          const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
          try {
            const api_keys = user.applnx_api_keys;
            const url_response = await generateShortURL(
              api_keys,
              signature,
              urlParam
            );
            if (!url_response) {
              return res
                .status(400)
                .json({ error: "Failed to retrieve ShortUrl" });
            }
            shorturl = url_response;
          } catch (error) {
            return res
              .status(400)
              .json({ error: "Failed to retrieve ShortUrl" });
          }

          const newMessageData = {
            uid: NewUid,
            customer_id: user.uid,
            recipient_externalid: recipient.id,
            recipient_originalid: recipient.Original_id,
            message_externalid: requestData.message_id,
            action: requestData.action,
            recipient_email: recipient.email,
            recipient_mobile: recipient.mobile,
            email_sign_details: requestData.email_sign_details,
            sharepoint_folder_path: requestData.sharepoint_folder_path,
            sharepoint_filename: requestData.sharepoint_filename,
            recipient_name: recipient.name,
            msg_service: requestData.msg_service,
            file_service: requestData.file_service,
            status: "New",
            alternate_email: requestData.alternate_email,
            otp_page: requestData.otp_page,
            is_readable: requestData.preview || false,
            expired: false,
            expired_date: new Date(),
            smsmessage: [
              {
                action: requestData.action,
                content: pageConfig.SMS_Content
                  ? pageConfig.SMS_Content.replace("{%URL%}", shorturl).replace(
                    "{%XXX%}",
                    recipient.name
                  )
                  : "",
                created_at: new Date(),
              },
            ],

            emailmessage: [
              {
                action: requestData.action,
                content: pageConfig
                  .get("EMAIL_Content")
                  .replace("{%URL%}", shorturl)
                  .replace("{%XXX%}", recipient.name),
                created_at: new Date(),
              },
            ],
            shorten_link: [
              {
                action: requestData.action,
                url: shorturl,
              },
            ],
            response: [],
            statusHistory: [
              {
                status: "created",
                datetime: new Date(),
                action: requestData.action,
              },
            ],
            message_custom_data: {
              status: "Draft",
              no_of_signs: "1",
            },
          };

          await createLog(
            {
              trigger_event: "Record Created Event",
              message_id: NewUid,
              email: recipient.email,
            },
            { req }
          );

          for (const key in requestData) {
            if (
              key !== "recipients" &&
              key !== "message_id" &&
              key !== "action" &&
              key !== "msg_service" &&
              key !== "file_service" &&
              key !== "otp_page"
            ) {
              newMessageData.message_custom_data[key] = requestData[key];
            }
          }

          const newMessage = new Message(newMessageData);
          await newMessage.save();

          if (newMessage) {
            if (newMessage.msg_service.includes("sms")) {
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
                sms.push({
                  error: `Failed to send SMS to ${recipient.mobile}`,
                });
              }
            }
            if (newMessage.msg_service.includes("email")) {
              const sign = requestData.email_sign_details;

              let emailTemplate =
                requestData.email_body && requestData.email_body.trim() !== ""
                  ? requestData.email_body
                  : email_data.templateData.html;

              // Use email_subject from payload if available and not null/empty, otherwise use template subject
              const subject =
                requestData.email_subject &&
                  requestData.email_subject.trim() !== ""
                  ? requestData.email_subject
                  : email_data.subject;

              emailTemplate = emailTemplate
                .replace(/{%URL%}/g, shorturl)
                .replace(/{%XXX%}/g, newMessage.recipient_name);

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

              const id = requestData.message_id;
              let cc = requestData.alternate_email;

              if (requestData.preview) {
                const emailResponse = await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  newMessage.recipient_email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
                if (
                  emailResponse &&
                  emailResponse.response &&
                  emailResponse.response.startsWith("250")
                ) {
                  emailSuccess = true;
                  email.push(
                    `Email has been sent successfully to ${newMessage.recipient_email}`
                  );
                } else if (emailResponse && emailResponse.error) {
                  email.push({
                    error: `Failed to send emailto ${newMessage.recipient_email}`,
                  });
                } else {
                  email.push({
                    error: "Failed to send email: Unexpected response",
                  });
                }
              } else {
                const emailResponse = await sendEmail2(
                  email_service,
                  email_name,
                  email_token,
                  newMessage.recipient_email,
                  subject,
                  emailTemplate,
                  customer_id,
                  "",
                  cc,
                  id,
                  requestData.reply_to,
                  from_name
                );
                if (
                  emailResponse &&
                  emailResponse.response &&
                  emailResponse.response.startsWith("250")
                ) {
                  emailSuccess = true;
                  email.push(
                    `Email has been sent successfully to ${newMessage.recipient_email}`
                  );
                } else if (emailResponse && emailResponse.error) {
                  email.push({
                    error: `Failed to send emailto ${newMessage.recipient_email}`,
                  });
                } else {
                  email.push({
                    error: "Failed to send email: Unexpected response",
                  });
                }
              }
            }
            if (requestData.preview) {
              data.push({
                message: `Preview Link For ${newMessage.recipient_name}`,
                link: shorturl,
              });
            } else {
              if (smsSuccess || emailSuccess) {
                await createLog(
                  {
                    trigger_event: "Link Sent Event",
                    message_id: newMessage.uid,
                    email: newMessage.recipient_email,
                  },
                  { req }
                );
                await Message.updateOne(
                  { uid: newMessage.uid, expired: false },
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
                data.push({
                  message: `Link Distributed successfully For ${newMessage.recipient_name}`,
                  link: shorturl,
                });
              }
            }

            await counter(customer_id, type);
            await User.updateOne(
              { user_uid: customer_id },
              { $inc: { credits: -1 } }
            );
          }
        }
      }

      else if (requestData.action === "Hubspot_Esign") {
        let Temp_name;
        if (requestData.Hubspot_Esign_Data) {
          Temp_name = requestData.quote_temp_name;
        }
        const email_data = await EmailTemp.findOne({ templateName: Temp_name });
        if (!email_data) {
          return res
            .status(400)
            .json({ error: "Email Template Not Found For the Paylaod" });
        }
        const isMissing = (value) => !value || value.trim() === "";

        if (isMissing(requestData.app_api_key)) {
          return res.status(400).json({ error: "App Api Key is required" });
        }
        if (isMissing(requestData.doc_url)) {
          return res.status(400).json({ error: "Doc URL is required" });
        }

        let secureGatewayConfig = null;
        if (
          requestData.Hubspot_Esign_Data &&
          requestData.Hubspot_Esign_Data.Html_Link
        ) {
          try {
            secureGatewayConfig = await fetchSecureGatewayConfig(
              requestData.Hubspot_Esign_Data.Html_Link
            );

            // If no configuration was found, return an error
            if (!secureGatewayConfig) {
              return res.status(400).json({
                error: "No SecureGateway configuration found in HTML",
              });
            }
            requestData.secureGatewayConfig = secureGatewayConfig;
          } catch (error) {
            console.error(
              "Failed to extract SecureGateway configuration:",
              error
            );
            return res.status(400).json({
              error: `Failed to extract SecureGateway configuration: ${error.message}`,
            });
          }
        }

        let recipientsToProcess = [];
        let recipientsForEmail = []; // New array for email recipients

        if (
          requestData.Hubspot_Esign_Data &&
          requestData.Hubspot_Esign_Data.Html_Link
        ) {
          try {
            secureGatewayConfig = await fetchSecureGatewayConfig(
              requestData.Hubspot_Esign_Data.Html_Link
            );

            if (!secureGatewayConfig) {
              return res.status(400).json({
                error: "No SecureGateway configuration found in HTML",
              });
            }

            requestData.secureGatewayConfig =
              requestData.secureGatewayConfig || {};
            requestData.secureGatewayConfig = secureGatewayConfig;
            const { confidential_data = [], e_sign_settings } =
              secureGatewayConfig;

            if (confidential_data.length === 0) {
              return res.status(400).json({
                error: "No recipients found in SecureGateway configuration",
              });
            }

            if (e_sign_settings === "Chain") {
              // Generate links for ALL recipients
              recipientsToProcess = confidential_data.map((signer) => ({
                email: signer.e_sign_email,
                user_designation: signer.user_designation,
                e_sign_otp: signer.e_sign_otp,
                e_sign_order: signer.e_sign_order,
              }));

              // But only send email to the first signer (order 1)
              const firstSigner = confidential_data.find(
                (signer) => signer.e_sign_order === 1
              );

              if (firstSigner) {
                recipientsForEmail = [
                  {
                    email: firstSigner.e_sign_email,
                    user_designation: firstSigner.user_designation,
                    e_sign_otp: firstSigner.e_sign_otp,
                    e_sign_order: firstSigner.e_sign_order,
                  },
                ];
              }

              if (recipientsToProcess.length === 0) {
                console.warn("No recipients found for Chain mode");
                recipientsToProcess = requestData.recipients;
                recipientsForEmail = requestData.recipients;
              }
            } else if (e_sign_settings === "Broadcast") {
              // For Broadcast, process and send emails to all recipients
              recipientsToProcess = confidential_data.map((signer) => ({
                email: signer.e_sign_email,
                user_designation: signer.user_designation,
                e_sign_otp: signer.e_sign_otp,
                e_sign_order: signer.e_sign_order,
              }));
              recipientsForEmail = recipientsToProcess; // Send emails to all
            }
          } catch (error) {
            console.error(
              "Failed to extract SecureGateway configuration:",
              error
            );
            return res.status(400).json({
              error: `Failed to extract SecureGateway configuration: ${error.message}`,
            });
          }
        }

        if (!secureGatewayConfig) {
          recipientsToProcess = requestData.recipients || [];
          recipientsForEmail = requestData.recipients || [];
        }

        if (recipientsToProcess.length === 0) {
          return res.status(400).json({ error: "No recipients to process" });
        }

        const NewUid = crypto.randomBytes(16).toString("hex");
        let existingMessage = null;

        for (const recipient of recipientsToProcess) {
          let foundMessage;
          if (recipient) {
            foundMessage = await Message.findOne({
              customer_id: user.uid,
              message_externalid: requestData.message_id,
              action: requestData.action,
            });
          }
          if (foundMessage) {
            existingMessage = foundMessage;
            break;
          }
        }

        // If an existing message is found and has signatures, return early
        if (
          existingMessage &&
          existingMessage.signatures &&
          existingMessage.signatures.length > 0
        ) {
          return res
            .status(400)
            .json({ message: "Recipient Has Already Agreed The Quote" });
        }

        // Process each recipient with their own unique shortUrl
        const messageData = existingMessage || {
          uid: NewUid,
          customer_id: user.uid,
          message_externalid: requestData.message_id,
          action: requestData.action,
          msg_service: requestData.msg_service,
          file_service: requestData.file_service,
          status: "New",
          alternate_email: requestData.alternate_email,
          otp_page: requestData.otp_page,
          expired: false,
          expired_date: new Date(),
          shorten_link: [],
          smsmessage: [],
          emailmessage: [],
          response: [],
          statusHistory: existingMessage?.statusHistory || [
            {
              status: "created",
              datetime: new Date(),
              action: requestData.action,
            },
          ],
          message_custom_data: {
            status: "Draft",
            no_of_signs: "1",
          },
        };

        await createLog(
          {
            trigger_event: "Record Created Event",
            message_id: messageData.uid,
          },
          { req }
        );

        // Add all custom data to message_custom_data
        for (const key in requestData) {
          if (
            key !== "recipients" &&
            key !== "message_id" &&
            key !== "action" &&
            key !== "msg_service" &&
            key !== "file_service" &&
            key !== "otp_page"
          ) {
            messageData.message_custom_data[key] = requestData[key];
          }
        }

        let smsSuccess = false;
        let emailSuccess = false;
        const data = [];
        const sms = [];
        const email = [];

        // Generate links for ALL recipients (recipientsToProcess)
        for (const recipient of recipientsToProcess) {
          // Check if we already have a shortURL for this recipient
          let shorturl = null;

          if (existingMessage) {
            const existingLink = existingMessage.shorten_link.find(
              (link) =>
                link.action === requestData.action &&
                link.recipient_email === recipient.email
            );

            if (existingLink) {
              shorturl = existingLink.url;
            }
          }

          // If no shortURL exists for this recipient, create one
          if (!shorturl) {
            const replacedURL = pageConfig.url
              .replace("{%action%}", pageConfig.action)
              .replace("{%uid%}", messageData.uid)
              .replace("{%template%}", pageConfig.template);

            const currentTime = new Date()
              .toLocaleString("en-GB")
              .replace(",", "")
              .replace(/\//g, "-");
            const urlParam = `${replacedURL}?source=${requestData.msg_service
              }?otp_page=${recipient.e_sign_otp}?stepper_email=${recipient.email
              }?time=${encodeURIComponent(currentTime)}`;
            const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
            try {
              const api_keys = user.applnx_api_keys;
              const url_response = await generateShortURL(
                api_keys,
                signature,
                urlParam
              );

              if (!url_response) {
                return res
                  .status(400)
                  .json({ error: "Failed to retrieve ShortUrl" });
              }
              shorturl = url_response;

              // Add this link to the shorten_link array with recipient email
              messageData.shorten_link.push({
                action: requestData.action,
                url: shorturl,
                recipient_email: recipient.email,
              });
            } catch (error) {
              console.log(error);
              return res
                .status(400)
                .json({ error: "Failed to retrieve ShortUrl" });
            }
          }

          // Add to data array for all recipients (for response)
          data.push({
            message: `Link Generated For ${recipient.name || recipient.email}`,
            link: shorturl,
            email_sent: recipientsForEmail.some(
              (r) => r.email === recipient.email
            )
              ? "Yes"
              : "No",
          });
        }

        const apiKey = requestData.app_api_key;

        // Assuming `recipientsForEmail` is an array of objects like: { name, email }
        const updatedRecipients = recipientsForEmail.map((recipient) => {
          const recipientLink = messageData.shorten_link.find(
            (link) => link.recipient_email === recipient.email
          );

          return {
            ...recipient,
            link: recipientLink?.url || null,
          };
        });

        const stringifiedRecipients = JSON.stringify(updatedRecipients);

        const requestBody = {
          all_links_to_esign: stringifiedRecipients, // now includes link per recipient
        };

        const final_body = {
          properties: requestBody,
        };

        const response = await axios({
          method: "PATCH",
          url: requestData.doc_url,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          data: final_body,
        });

        // Send emails/SMS only to recipients in recipientsForEmail
        for (const recipient of recipientsForEmail) {
          // Find the corresponding link for this recipient
          const recipientLink = messageData.shorten_link.find(
            (link) => link.recipient_email === recipient.email
          );

          if (!recipientLink) {
            console.error(`No link found for recipient ${recipient.email}`);
            continue;
          }
          const username = recipient?.email?.split("@")[0];
          const shorturl = recipientLink.url;

          // Save recipient-specific information
          messageData.recipient_externalid = recipient.id;
          messageData.recipient_originalid = recipient.Original_id;
          messageData.recipient_email = recipient.email;
          messageData.recipient_mobile = recipient.mobile;
          messageData.recipient_name = recipient.name;
          messageData.email_sign_details = requestData.email_sign_details;
          messageData.sharepoint_folder_path =
            requestData.sharepoint_folder_path;
          messageData.sharepoint_filename = requestData.sharepoint_filename;
          messageData.is_readable = requestData.preview || false;

          // Email and SMS message handling
          const sign = requestData.email_sign_details;

          let emailTemplate;
          let subject;

          // Check if recipient is a Manager and use manager-specific email content if available
          if (recipient.user_designation === "Manager") {
            emailTemplate =
              requestData.manager_email_body && requestData.manager_email_body.trim() !== ""
                ? requestData.manager_email_body
                : email_data.templateData.html;

            subject =
              requestData.manager_email_subject && requestData.manager_email_subject.trim() !== ""
                ? requestData.manager_email_subject
                : email_data.subject;
          } else {
            emailTemplate =
              requestData.email_body && requestData.email_body.trim() !== ""
                ? requestData.email_body
                : email_data.templateData.html;

            subject =
              requestData.email_subject && requestData.email_subject.trim() !== ""
                ? requestData.email_subject
                : email_data.subject;
          }

          emailTemplate = emailTemplate
            .replace(/{%URL%}/g, shorturl)
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
              .replace(/{%org_owner_mobile%}/g, sign?.org_owner_mobile || "")
              .replace(/{%org_owner_phone%}/g, sign?.org_owner_phone || "")
              .replace(/{%org_owner_email%}/g, sign?.org_owner_email || "")
              .replace(/{%org_owner_wesite%}/g, sign?.org_owner_wesite || "")
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

          const id = requestData.message_id;
          let cc = requestData.alternate_email;

          // Handle preview mode
          if (requestData.preview) {
            // Update the data array to show preview
            const dataIndex = data.findIndex((d) => d.link === shorturl);
            if (dataIndex !== -1) {
              data[dataIndex].message = `Preview Link For ${recipient.name || recipient.email
                }`;
            }
          } else {
            // Send SMS if configured
            if (messageData.msg_service.includes("sms")) {
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
                sms.push(
                  `${smsResponse.response_msg} For ${recipient.name || recipient.email
                  }`
                );
              } else {
                sms.push({
                  error: `Failed to send SMS to ${recipient.mobile}`,
                });
              }
            }

            // Send email if configured
            if (messageData.msg_service.includes("email")) {
              const emailResponse = await sendEmail2(
                email_service,
                email_name,
                email_token,
                recipient.email,
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
                  `Email has been sent successfully to ${recipient.email}`
                );
              } else if (emailResponse && emailResponse.error) {
                email.push({
                  error: `Failed to send email to ${recipient.email}`,
                });
              } else {
                email.push({
                  error: "Failed to send email: Unexpected response",
                });
              }
            }

            // Update the data array to show distribution
            const dataIndex = data.findIndex((d) => d.link === shorturl);
            if (dataIndex !== -1) {
              data[dataIndex].message = `Link Distributed successfully For ${recipient.name || recipient.email
                }`;
            }
          }
        }

        // Save or update the message document with all recipient links
        if (existingMessage) {
          // Update existing message
          const filter = {
            customer_id: user.uid,
            message_externalid: requestData.message_id,
            action: requestData.action,
          };
          await createLog(
            {
              trigger_event: requestData.preview
                ? "Data Update Event"
                : "Link Resend Event",
              message_id: requestData.message_id,
              email: existingMessage.recipient_email,
            },
            { req }
          );
          const updateData = {
            status: requestData.preview ? "updation" : "resend",
            shorten_link: messageData.shorten_link,
            $push: {
              statusHistory: {
                status: requestData.preview ? "data_updated" : "link_resend",
                datetime: new Date(),
                action: requestData.action,
              },
            },
          };

          const excludedKeys = [
            "recipients",
            "message_id",
            "action",
            "msg_service",
            "file_service",
          ];

          for (const key in requestData) {
            if (!excludedKeys.includes(key)) {
              updateData[`message_custom_data.${key}`] = requestData[key];
            }
          }

          const options = { new: true };
          const updatedMessage = await Message.findOneAndUpdate(
            filter,
            updateData,
            options
          );

          if (!updatedMessage) {
            return res.status(400).json({ error: "Failed to update message" });
          }
        } else {
          // Create new message with all recipient links
          const newMessage = new Message(messageData);
          await newMessage.save();

          if (newMessage) {
            if (smsSuccess || emailSuccess) {
              await createLog(
                {
                  trigger_event: "Link Sent Event",
                  message_id: newMessage.uid,
                  email: newMessage.recipient_email,
                },
                { req }
              );
              await Message.updateOne(
                { uid: newMessage.uid, expired: false },
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
            }

            // Only consume credits once per message, not per recipient
            await counter(customer_id, type);
            await User.updateOne(
              { user_uid: customer_id },
              { $inc: { credits: -1 } }
            );
          }
        }

        // Return success response with data
        return res.status(200).json({
          success: true,
          data,
          sms,
          email,
          e_sign_mode: secureGatewayConfig?.e_sign_settings || "Unknown",
          total_links_generated: recipientsToProcess.length,
          emails_sent_to: recipientsForEmail.length,
        });
      }

      else if (requestData.action === "Ajm_Autosure_Esign") {
        let Temp_name;

        if (requestData.Ajm_Autosure_Esign) {
          Temp_name = "AJM_QUOTE";
        }

        const email_data = await EmailTemp.findOne({ templateName: Temp_name });
        if (!email_data) {
          return res
            .status(400)
            .json({ error: "Email Template Not Found For the Paylaod" });
        }

        const sendData = requestData?.Ajm_Autosure_Esign?.send_data;
        const hubData = sendData?.data?.hubData;
        const insuranceType = sendData?.insuranceType; // "mbi", "ppi", or "gap"
        const api_key = requestData?.app_api_key;

        // Extract the policyId dynamically based on type
        let policyId = "";
        if (insuranceType === "mbi") {
          policyId = hubData?.autosure_mbi_policy;
        } else if (insuranceType === "gap") {
          policyId = hubData?.autosure_gap_policy;
        } else if (insuranceType === "ppi") {
          policyId = hubData?.autosure_ppi_policy;
        }

        const dealId = requestData.message_id; // Extract "2-43716204"

        // Compose document name
        const document_name = `${insuranceType.toUpperCase()}_Declaration_Policy`;

        // Compose payload
        const documentRetrievalPayload = {
          associations: [
            {
              types: [
                {
                  associationCategory: "USER_DEFINED",
                  associationTypeId: 159,
                },
              ],
              to: {
                id: dealId,
              },
            },
          ],
          properties: {
            document_id: policyId,
            document_name,
            document_type: "Autosure policy documents",
            is_esigned_document: "true",
          },
        };

        const DealDocData = await axios({
          method: "POST",
          url: hubData?.document_retrieval_url,
          headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
          },
          data: documentRetrievalPayload,
        });

        const DealDocId = DealDocData.data;

        // Check if any recipient has already agreed to the quote
        for (const recipient of requestData.recipients) {
          const existingMessage = await Message.findOne({
            customer_id: user.uid,
            message_externalid: DealDocId.id,
            action: requestData.action,
          });

          if (
            existingMessage &&
            existingMessage.signatures &&
            existingMessage.signatures.length > 0
          ) {
            return res
              .status(200)
              .json({ message: "Recipient Has Already Agreed The Quote" });
          }
        }

        // Check if a record already exists for this document and action
        const existingMessage = await Message.findOne({
          customer_id: user.uid,
          message_externalid: DealDocId.id,
          action: requestData.action,
        });

        let messageRecord;
        let shorturl;

        if (existingMessage) {
          // Update existing record
          console.log(requestData.preview);
          const filter = {
            customer_id: user.uid,
            message_externalid: DealDocId.id,
            action: requestData.action,
          };

          const excludedKeys = [
            "message_id",
            "action",
            "msg_service",
            "file_service",
          ];

          const updateData = {
            recipients: requestData.recipients, // Update all recipients
            is_readable: requestData.preview,
          };

          for (const key in requestData) {
            if (!excludedKeys.includes(key)) {
              updateData[`message_custom_data.${key}`] = requestData[key];
            }
          }

          const options = { new: true };
          messageRecord = await Message.findOneAndUpdate(
            filter,
            updateData,
            options
          );

          if (!messageRecord) {
            return res.status(400).json({ error: "Failed to update message" });
          }

          const shortenLink = messageRecord.shorten_link.find(
            (link) => link.action === requestData.action
          );

          if (shortenLink && shortenLink.url) {
            shorturl = shortenLink.url;
            data.push({
              link: shorturl,
              message: "Message Updated Successfully",
            });
          }
        } else {
          // Create new record with primary recipient (first one)
          const primaryRecipient = requestData.recipients[0];
          const NewUid = crypto.randomBytes(16).toString("hex");
          const replacedURL = pageConfig.url
            .replace("{%action%}", pageConfig.action)
            .replace("{%uid%}", NewUid)
            .replace("{%template%}", pageConfig.template);
          const urlParam = `${replacedURL}?source=${requestData.msg_service}?otp_page=${requestData.otp_page}`;

          const signature = status_code.APPLNX_SHORT_URL_SIGNATURE;
          try {
            const api_keys = user.applnx_api_keys;
            const url_response = await generateShortURL(
              api_keys,
              signature,
              urlParam
            );
            if (!url_response) {
              return res
                .status(400)
                .json({ error: "Failed to retrieve ShortUrl" });
            }
            shorturl = url_response;
          } catch (error) {
            return res
              .status(400)
              .json({ error: "Failed to retrieve ShortUrl" });
          }

          const newMessageData = {
            uid: NewUid,
            customer_id: user.uid,
            recipient_externalid: primaryRecipient.id,
            recipient_originalid: primaryRecipient.Original_id,
            message_externalid: DealDocId.id,
            action: requestData.action,
            recipient_email: primaryRecipient.email,
            recipient_mobile: primaryRecipient.mobile,
            recipient_name: primaryRecipient.name,
            recipients: requestData.recipients, // Store all recipients
            email_sign_details: requestData.email_sign_details,
            sharepoint_folder_path: requestData.sharepoint_folder_path,
            sharepoint_filename: requestData.sharepoint_filename,
            msg_service: requestData.msg_service,
            file_service: requestData.file_service,
            status: "New",
            alternate_email: requestData.alternate_email,
            otp_page: requestData.otp_page,
            is_readable: requestData.preview || false,
            expired: false,
            expired_date: new Date(),
            smsmessage: [
              {
                action: requestData.action,
                content: pageConfig.SMS_Content
                  ? pageConfig.SMS_Content.replace("{%URL%}", shorturl).replace(
                    "{%XXX%}",
                    primaryRecipient.name
                  )
                  : "",
                created_at: new Date(),
              },
            ],
            emailmessage: [
              {
                action: requestData.action,
                content: pageConfig
                  .get("EMAIL_Content")
                  .replace("{%URL%}", shorturl)
                  .replace("{%XXX%}", primaryRecipient.name),
                created_at: new Date(),
              },
            ],
            shorten_link: [
              {
                action: requestData.action,
                url: shorturl,
              },
            ],
            response: [],
            statusHistory: [
              {
                status: "created",
                datetime: new Date(),
                action: requestData.action,
              },
            ],
            message_custom_data: {
              status: "Draft",
              no_of_signs: "1",
            },
          };

          await createLog(
            {
              trigger_event: "Record Created Event",
              message_id: NewUid,
              email: primaryRecipient.email,
            },
            { req }
          );

          for (const key in requestData) {
            if (
              key !== "recipients" &&
              key !== "message_id" &&
              key !== "action" &&
              key !== "msg_service" &&
              key !== "file_service" &&
              key !== "otp_page"
            ) {
              newMessageData.message_custom_data[key] = requestData[key];
            }
          }

          const newMessage = new Message(newMessageData);
          await newMessage.save();
          messageRecord = newMessage;

          // Increment counter and deduct credits only once
          await counter(customer_id, type);
          await User.updateOne(
            { user_uid: customer_id },
            { $inc: { credits: -1 } }
          );
        }

        // Send notifications to all recipients using the same URL
        let smsSuccess = false;
        let emailSuccess = false;
        const sms = [];
        const email = [];

        for (const recipient of requestData.recipients) {
          // Send SMS if enabled
          if (messageRecord.msg_service.includes("sms")) {
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
              sms.push(`${smsResponse.response_msg} For ${recipient.name}`);
            } else {
              sms.push({
                error: `Failed to send SMS to ${recipient.mobile}`,
              });
            }
          }

          // Send Email if enabled
          if (messageRecord.msg_service.includes("email")) {
            const sign = requestData.email_sign_details;

            let emailTemplate =
              requestData.email_body && requestData.email_body.trim() !== ""
                ? requestData.email_body
                : email_data.templateData.html;

            // Use email_subject from payload if available and not null/empty, otherwise use template subject
            const subject =
              requestData.email_subject &&
                requestData.email_subject.trim() !== ""
                ? requestData.email_subject
                : email_data.subject;

            emailTemplate = emailTemplate
              .replace(/{%URL%}/g, shorturl)
              .replace(/{%XXX%}/g, recipient.name);

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
                .replace(/{%org_owner_mobile%}/g, sign?.org_owner_mobile || "")
                .replace(/{%org_owner_phone%}/g, sign?.org_owner_phone || "")
                .replace(/{%org_owner_email%}/g, sign?.org_owner_email || "")
                .replace(/{%org_owner_wesite%}/g, sign?.org_owner_wesite || "")
                .replace(
                  /{%org_owner_company_address%}/g,
                  sign?.org_owner_company_address || ""
                );
            }

            const id = DealDocId.id;
            let cc = requestData.alternate_email;

            if (!requestData.preview) {
              const emailResponse = await sendEmail2(
                email_service,
                email_name,
                email_token,
                recipient.email,
                subject,
                emailTemplate,
                customer_id,
                "",
                cc,
                id,
                requestData.reply_to,
                from_name
              );

              if (
                emailResponse &&
                emailResponse.response &&
                emailResponse.response.startsWith("250")
              ) {
                emailSuccess = true;
                email.push(
                  `Email has been sent successfully to ${recipient.email}`
                );
              } else if (emailResponse && emailResponse.error) {
                email.push({
                  error: `Failed to send email to ${recipient.email}`,
                });
              } else {
                email.push({
                  error: "Failed to send email: Unexpected response",
                });
              }
            }
          }

          // Create log for each recipient
          await createLog(
            {
              trigger_event: requestData.preview
                ? "Data Update Event"
                : "Link Sent Event",
              message_id: messageRecord.uid,
              email: recipient.email,
            },
            { req }
          );
        }

        // Update message status based on preview flag
        if (requestData.preview) {
          await Message.updateOne(
            { uid: messageRecord.uid, expired: false },
            {
              $set: { status: "updation" },
              $push: {
                statusHistory: {
                  status: "data_updated",
                  datetime: new Date(),
                  action: requestData.action,
                },
              },
            }
          );
          data.push({
            message: `Preview Link Generated`,
            link: shorturl,
            recipients: requestData.recipients.map((r) => r.name),
          });
        } else {
          if (smsSuccess || emailSuccess) {
            await Message.updateOne(
              { uid: messageRecord.uid, expired: false },
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
            data.push({
              message: `Link Distributed successfully to all recipients`,
              link: shorturl,
              recipients: requestData.recipients.map((r) => r.name),
            });
          } else {
            await Message.updateOne(
              { uid: messageRecord.uid, expired: false },
              {
                $set: { status: "resend" },
                $push: {
                  statusHistory: {
                    status: "link_resend",
                    datetime: new Date(),
                    action: requestData.action,
                  },
                },
              }
            );
          }
        }
      }

      res.status(200).json({ message: data, sms, email });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: err.message });
    }
  };
  handleRequest();
};

module.exports = {
  createMessage: createMessage,
};
