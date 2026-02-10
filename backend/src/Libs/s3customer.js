const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Customer = require("../models/model").Customer;
const Message = require("../models/model").Message;
const EmailTemp = require("../models/model").emailtemp;
const config = require("../../config/environment/dbDependencies");
const status_code = require("../Libs/constants");
const sendEmail = require("./sendemail");
const { refreshDropboxAccessToken } = require("../Libs/cron");
const { Dropbox } = require("dropbox");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const s3Client = new S3Client({
  region: status_code.S3_CUSTOMER_REGION,
  credentials: {
    accessKeyId: status_code.S3_CUSTOMER_ACCESS_KEY,
    secretAccessKey: status_code.S3_CUSTOMER_SECRET_KEY,
  },
});

const S3Upload = async (req, res) => {
  const uid = req.params.uid;
  const type = req.body.type;
  const pageName = req.body.pageName;
  let email_token, email_name, email_service ,from_name;

  if (!uid || uid.trim() === "") {
    return res.status(400).json({ message: "uid is required" });
  }

  if (!type || (type !== "assets" && type !== "file" && type !== "templates")) {
    return res.status(400).json({ message: "Invalid type" });
  }

  try {
    const customer = await Customer.findOne({ uid });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customer_id = customer.get("uid");
    const bucketName = status_code.S3_CUSTOMER_BUCKET_NAME;
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

    if (type === "assets") {
      const promises = req.files.map(async (file) => {
        const filePath = `${config.BaseFolder}/Customer_Branding/${folderName}/${file.originalname}`;
        try {
          await s3Client.send(
            new HeadObjectCommand({ Bucket: bucketName, Key: filePath })
          );
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: filePath })
          );
        } catch (error) {
          if (error.name !== "NotFound") {
            console.error("Error checking for existing file:", error);
            throw new Error("Error checking for existing file in S3");
          }
        }
        const uploadParams = {
          Bucket: bucketName,
          Key: filePath,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        return filePath;
      });

      const filePaths = await Promise.all(promises);

      const brandingLogos = filePaths.map((filePath) => ({
        page_name: pageName,
        Logo_Path: filePath,
      }));

      await Customer.updateOne(
        { uid },
        {
          $set: {
            "branding.branding_logo.$[elem].Logo_Path":
              brandingLogos[0].Logo_Path,
          },
        },
        { arrayFilters: [{ "elem.page_name": pageName }] }
      );

      return res.status(200).json({
        message: "Assets uploaded successfully and URLs updated in MongoDB",
      });
    }
    if (type === "templates") {
      const promises = req.files.map(async (file) => {
        const filePath = `${config.BaseFolder}/Customer_Templates/${folderName}/${file.originalname}`;
        try {
          await s3Client.send(
            new HeadObjectCommand({ Bucket: bucketName, Key: filePath })
          );
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: filePath })
          );
        } catch (error) {
          if (error.name !== "NotFound") {
            console.error("Error checking for existing file:", error);
            throw new Error("Error checking for existing file in S3");
          }
        }
        const uploadParams = {
          Bucket: bucketName,
          Key: filePath,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        return filePath;
      });

      const filePaths = await Promise.all(promises);

      const brandingLogos = filePaths.map((filePath) => ({
        page_name: pageName,
        Logo_Path: filePath,
      }));

      await Customer.updateOne(
        { uid },
        {
          $set: {
            "branding.branding_template.$[elem].Logo_Path":
              brandingLogos[0].Logo_Path,
          },
        },
        { arrayFilters: [{ "elem.page_name": pageName }] }
      );

      return res.status(200).json({
        message: "Assets uploaded successfully and URLs updated in MongoDB",
      });
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
      const stepper = data.stepper;
      const signatures = data.signatures;

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

      // Find the message to check if it has a Signature_List
      const foundemessage = await Message.findOne({ uid: msg_id });
      if (!foundemessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      const signatureList =
        foundemessage.message_custom_data?.Signature_List || [];
      const finalPdfChangesList =
        foundemessage.message_custom_data?.final_pdf_changes || [];

      const hasSignatureList = signatureList.length > 0;

      // Find configurations
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

      const updatedSignatures = signatures.map((signature) => ({
        ...signature,
        date: signature.date || new Date(), // Add current date if not present
      }));

      let result = await Message.findOneAndUpdate(
        { uid: msg_id },
        {
          $push: { signatures: { $each: updatedSignatures } },
          $set: { status: "Responded" },
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ message: "Message not updated" });
      }

      const currentSignatureCount = (result.signatures || []).length;

      if (hasSignatureList) {
        const nextSignerIndex = currentSignatureCount - 1;

        if (nextSignerIndex < signatureList.length) {
          const nextSigner = signatureList[nextSignerIndex];

          const Rec_Name = nextSigner.Name || "Signer";

          let Temp_name;

          if (action === "Bwd_Esign") {
            Temp_name = "BWD_ESIGN";
          }

          const email_data = await EmailTemp.findOne({
            templateName: Temp_name,
          });

          const shortenedLink = foundemessage.shorten_link?.find(
            (link) => link.action === action
          )?.url;

          if (shortenedLink) {
            const sign = foundemessage.email_sign_details;

            let emailTemplate = `${email_data.templateData.html
              .replace("{%URL%}", shortenedLink)
              .replace("{%XXX%}", Rec_Name)
              .replace("{%org_owner_name%}", sign?.org_owner_name)
              .replace("{%org_owner_info%}", sign?.org_owner_info)
              .replace("{%org_owner_designation%}", sign?.org_owner_designation)
              .replace(
                "{%org_owner_company_name%}",
                sign?.org_owner_company_name
              )
              .replace("{%org_owner_mobile%}", sign?.org_owner_mobile)
              .replace("{%org_owner_phone%}", sign?.org_owner_phone)
              .replace("{%org_owner_email%}", sign?.org_owner_email)
              .replace("{%org_owner_wesite%}", sign?.org_owner_wesite)
              .replace(
                "{%org_owner_company_address%}",
                sign?.org_owner_company_address
              )}`;
            const subject = email_data.subject;

            await sendEmail(
              email_service,
              email_name,
              email_token,
              nextSigner.Email,
              subject,
              emailTemplate,
              customer_id,
              [] // No attachments, just sending the link
            );
          }

          return res.json({
            message: "Signature recorded and sent to next signer",
            nextSigner: nextSigner.Name,
            nextSignerEmail: nextSigner.Email,
          });
        }
      }

      const fileBuffer = Buffer.from(file_data, "base64");
      const filePath = `${config.BaseFolder}/Customer_Files/${folderName}/${file_name}`;

      const uploadParams = {
        Bucket: bucketName,
        Key: filePath,
        Body: fileBuffer,
        ContentType: file_mime_type,
      };

      const attachments = [
        {
          filename: file_name,
          content: fileBuffer,
          contentType: file_mime_type,
        },
      ];
      const sign = foundemessage.email_sign_details;
      const Rec_Name = file_name.split("-")[0];
      const subject = pageConfig.get("EMAIL_Subject");
      const body = pageConfig
        .get("EMAIL_Content")
        .replace("{%Name%}", Rec_Name)
        .replace("{%Form_Name%}", pdf_name)
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
        );

      // Upload to S3
      await s3Client.send(new PutObjectCommand(uploadParams));

      const signatureEmails = Array.isArray(signatureList)
        ? signatureList.map((signer) => signer?.Email).filter(Boolean)
        : [];

      // Ensure finalPdfChangesList is a valid array of email strings
      const pdfChangeEmails = Array.isArray(finalPdfChangesList)
        ? finalPdfChangesList.filter(
            (email) => typeof email === "string" && email.trim() !== ""
          )
        : [];

      // Merge and deduplicate
      const ccEmails = Array.from(
        new Set([...signatureEmails, ...pdfChangeEmails])
      );

      // Send email with the file
      await sendEmail(
        email_service,
        email_name,
        email_token,
        rec_email,
        subject,
        body,
        customer_id,
        attachments,
        ccEmails
      );

      const responseItems = [];
      let dropboxLink = "";
      let dropboxSharedLink = "";

      // Handle Dropbox upload
      let folderId;
      const accessToken = fileConfig.access_key.trim();
      const dbx = new Dropbox({ accessToken: accessToken });

      let folder;
      folder = `${msg_id}`;
      if (pdf_name === "Quote_Agreement_BWD") {
        folder = `${message_id}`;
      }

      try {
        const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folder}`;
        const folderExistsResponse = await dbx.filesGetMetadata({
          path: folderPath,
        });
        folderId = folderExistsResponse.result.id;
        console.log("Folder already exists in Dropbox. Using existing folder.");
      } catch (error) {
        if (error.status === 409) {
          console.log(
            "Folder already exists in Dropbox. Using existing folder."
          );
        } else {
          console.log("Access token expired. Refreshing access token.");
          try {
            await refreshDropboxAccessToken(customer);
            return res.redirect(req.originalUrl);
          } catch (refreshError) {
            console.error(
              "Error refreshing access token:",
              refreshError.message
            );
            return res
              .status(500)
              .json({ message: "Error refreshing access token" });
          }
        }
      }

      if (!folderId) {
        try {
          const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folder}`;
          await dbx.filesCreateFolderV2({ path: folderPath });
          const defaultFileName = `.${message_id}.sfdb`;
          const defaultFileContent = "Do Not Delete";
          await dbx.filesUpload({
            path: `${folderPath}/${defaultFileName}`,
            contents: defaultFileContent,
          });
        } catch (error) {
          console.error("Error creating folder or default file:", error);
          return res.status(500).json({
            message: "Error creating folder or default file in Dropbox",
          });
        }
      }

      try {
        const folderPath = `/${config.BaseFolder}/Private Salesforce Documents/Opportunities/${folder}`;
        const listResponse = await dbx.filesListFolder({ path: folderPath });
        for (const entry of listResponse.result.entries) {
          if (entry.name.startsWith(file_name)) {
            await dbx.filesDeleteV2({ path: entry.path_lower });
          }
        }

        const uploadResponse = await dbx.filesUpload({
          path: `${folderPath}/${file_name}`,
          contents: fileBuffer,
        });

        const filePath = uploadResponse.result.path_display;
        const shareResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: filePath,
          settings: {
            requested_visibility: "public",
            audience: "public",
            access: "viewer",
          },
        });

        // Get the direct link to the file (replace dl=0 with dl=1 to force download)
        dropboxSharedLink = shareResponse.result.url.replace("?dl=0", "?dl=1");

        // Store both the path and the shareable link
        dropboxLink = filePath;

        const newResponseItem = {
          created_at: new Date(),
          action: action,
          data: file_name,
          link: dropboxLink,
          shared_link: dropboxSharedLink,
        };
        responseItems.push(newResponseItem);
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        return res
          .status(500)
          .json({ message: "Error uploading file to Dropbox" });
      }

      // Update the record with response items
      result = await Message.findOneAndUpdate(
        { uid: msg_id },
        {
          $push: { response: { $each: responseItems } },
        },
        { new: true }
      );

      // Make Salesforce API call if required
      if (pdf_name === "Quote_Agreement_BWD") {
        const payloadToSend = {
          message_id: message_id,
          is_submitted: true,
          dropbox_link: dropboxSharedLink || dropboxLink, // Send the shareable link to Salesforce instead of the path
        };

        try {
          const response = await axios.post(
            `https://flow-energy-6774--uat.sandbox.my.salesforce-sites.com/services/apexrest/UpdatedOpportunity/`,
            payloadToSend,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Salesforce API response:", response.data);
        } catch (axiosError) {
          console.error(
            "Error response from Salesforce:",
            axiosError.response?.data || axiosError.message
          );
          // Continue execution even if Salesforce API call fails
          console.log("Continuing despite Salesforce API error");
        }
      } else {
        console.log("No SF API call will be made.");
      }

      return res.json({ message: "Response submitted successfully" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error uploading files to S3" });
  }
};

const getImage = async (req, res) => {
  try {
    const uid = req.params.uid;
    const pageName = req.params.page_name;
    const customer = await Customer.findOne({ uid });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const brandingLogo = customer.branding.branding_logo.find(
      (logo) => logo.page_name === pageName
    );
    if (!brandingLogo) {
      return res.status(404).json({ error: "Logo not found for this page" });
    }

    const imagePath = brandingLogo.Logo_Path;
    const bucketName = status_code.S3_CUSTOMER_BUCKET_NAME;
    const params = { Bucket: bucketName, Key: imagePath };

    try {
      const { Body, ContentType, ContentLength } = await s3Client.send(
        new GetObjectCommand(params)
      );
      const streamToBuffer = async (stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });
      };

      const imageBuffer = await streamToBuffer(Body);
      res.writeHead(200, {
        "Content-Type": ContentType,
        "Content-Length": ContentLength,
      });
      res.end(imageBuffer);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving image" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving image" });
  }
};

const getFile = async (req, res) => {
  try {
    const uid = req.params.uid;
    const pageName = req.params.page_name;
    const customer = await Customer.findOne({ uid });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const brandingTemplate = customer.branding.branding_template.find(
      (template) => template.page_name === pageName
    );
    if (!brandingTemplate) {
      return res
        .status(404)
        .json({ error: "Template not found for this page" });
    }

    const filePath = brandingTemplate.Logo_Path;
    const bucketName = status_code.S3_CUSTOMER_BUCKET_NAME;
    const params = { Bucket: bucketName, Key: filePath };

    try {
      const { Body, ContentType, ContentLength } = await s3Client.send(
        new GetObjectCommand(params)
      );
      const streamToBuffer = async (stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });
      };

      const fileBuffer = await streamToBuffer(Body);

      res.writeHead(200, {
        "Content-Type": ContentType,
        "Content-Length": ContentLength,
      });
      res.end(fileBuffer);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving file" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving file" });
  }
};

const gets3Url = async (customer_id, logo_name, expiration_time) => {
  try {
    const uid = customer_id;
    const customer = await Customer.findOne({ uid });

    if (!customer) {
      console.error("Customer not found:", customer_id);
      return null;
    }

    const brandingLogo = customer.branding.branding_logo.find(
      (logo) => logo.page_name === logo_name
    );
    if (!brandingLogo) {
      console.error("Branding logo not found for:", logo_name);
      return null;
    }

    const imagePath = brandingLogo.Logo_Path;
    const bucketName = status_code.S3_CUSTOMER_BUCKET_NAME;
    const params = { Bucket: bucketName, Key: imagePath };

    try {
      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiration_time,
      });
      return signedUrl;
    } catch (error) {
      console.error("Error generating pre-signed URL from S3:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in gets3Url function:", error);
    return null;
  }
};

const gets3fileUrl = async (req, res) => {
  const { secret_key } = req.query;
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
    if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
      return res
        .status(status_code.UNAUTHORIZED_STATUS)
        .json({ error: "Expired Secret Key" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Illegal Access" });
  }
  try {
    const { token, path, expiration_time } = req.body;

    if (!token || !path || !expiration_time) {
      return res.status(400).json({
        error: "Missing required fields: token, path, expiration_time",
      });
    }

    const customer = await Customer.findOne({ token });

    if (!customer) {
      console.error("Customer not found for token:", token);
      return res.status(404).json({ error: "Customer not found" });
    }
    const config_data = customer.get("file_configuration");
    if (!Array.isArray(config_data) || config_data === 0) {
      return res
        .status(400)
        .json({ message: "No file configuration found for this user" });
    }

    const fileConfig = config_data.find(
      (config) => config.service_name === "S3"
    );
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

    const params = {
      Bucket: bucketName,
      Key: path,
    };

    try {
      const command = new GetObjectCommand(params);
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: parseInt(expiration_time),
      });

      return res.status(200).json({ signedUrl });
    } catch (error) {
      console.error("Error generating pre-signed URL from S3:", error);
      return res
        .status(500)
        .json({ error: "Failed to generate pre-signed URL" });
    }
  } catch (error) {
    console.error("Error in gets3fileUrl function:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const gets3fileContentUrl = async (req, res) => {
  const { secret_key } = req.query;
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
    if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
      return res
        .status(status_code.UNAUTHORIZED_STATUS)
        .json({ error: "Expired Secret Key" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Illegal Access" });
  }

  try {
    const { token, path } = req.body;

    if (!token || !path) {
      return res
        .status(400)
        .json({ error: "Missing required fields: token, path" });
    }

    const customer = await Customer.findOne({ token });
    if (!customer) {
      console.error("Customer not found for token:", token);
      return res.status(404).json({ error: "Customer not found" });
    }

    const config_data = customer.get("file_configuration");
    if (!Array.isArray(config_data) || config_data.length === 0) {
      return res
        .status(400)
        .json({ message: "No file configuration found for this user" });
    }

    const fileConfig = config_data.find(
      (config) => config.service_name === "S3"
    );
    if (!fileConfig) {
      return res.status(400).json({
        message: "File configuration for the specified service not found",
      });
    }

    const s3Client = new S3Client({
      region: fileConfig.region,
      credentials: {
        accessKeyId: fileConfig.access_key,
        secretAccessKey: fileConfig.secret_key,
      },
    });

    const params = {
      Bucket: fileConfig.bucket_name,
      Key: path,
    };

    const command = new GetObjectCommand(params);
    const s3Response = await s3Client.send(command);

    // Extract filename from path
    const filename = path.split("/").pop();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    s3Response.Body.pipe(res);
  } catch (error) {
    console.error("Error streaming file from S3:", error);
    return res.status(500).json({ error: "Failed to download file" });
  }
};

module.exports = {
  S3Upload: S3Upload,
  getImage: getImage,
  gets3Url: gets3Url,
  getFile: getFile,
  gets3fileUrl: gets3fileUrl,
  gets3fileContentUrl: gets3fileContentUrl,
};
