// controllers/proxyController.js
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Customer = require("../models/model").Customer;
const config = require("../../config/environment/dbDependencies");

const proxyController = {
  // Handle insurance API proxy requests
  proxyInsurance: async (req, res) => {
    try {
      const { targetUrl, method, data, headers, responseType } = req.body;

      // Validate required fields
      if (!targetUrl || !method) {
        return res.status(400).json({
          error: "Missing required fields: targetUrl and method",
        });
      }

      // Make the actual request to DPL Insurance API
      const response = await axios({
        method: method,
        url: targetUrl,
        data: data,
        headers: headers,
        responseType: responseType || "json",
        timeout: 30000, // 30 second timeout
      });

      // Return the response
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Proxy Insurance Error:", error.message);

      if (error.response) {
        // The request was made and the server responded with a status code
        res.status(error.response.status).json(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        res.status(500).json({ error: "No response from target server" });
      } else {
        // Something happened in setting up the request
        res.status(500).json({ error: "Request setup error" });
      }
    }
  },

  // Handle auth API proxy requests
  proxyAuth: async (req, res) => {
    try {
      const { targetUrl, method, data, headers } = req.body;

      if (!targetUrl || !method) {
        return res.status(400).json({
          error: "Missing required fields: targetUrl and method",
        });
      }

      const response = await axios({
        method: method,
        url: targetUrl,
        data: data,
        headers: headers,
        timeout: 30000,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Proxy Auth Error:", error.message);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else if (error.request) {
        res.status(500).json({ error: "No response from auth server" });
      } else {
        res.status(500).json({ error: "Auth request setup error" });
      }
    }
  },

  downloadAndUploadPolicyDocument: async (req, res) => {
    try {
      const {
        policyId,
        headers,
        HubspotData,
        service,
        type,
        api_key,
        dealId,
        documentData,
      } = req.body;

      const missingFields = [];

      if (!policyId) missingFields.push("policyId");
      if (!headers) missingFields.push("headers");
      if (!HubspotData) missingFields.push("HubspotData");
      if (!service) missingFields.push("service");
      if (!api_key) missingFields.push("api_key");
      if (!dealId) missingFields.push("dealId");
      if (!HubspotData?.document_retrieval_url)
        missingFields.push("HubspotData.document_retrieval_url");

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          missing: missingFields,
        });
      }

      let pdfBuffer;
      let fileName;

      // Check if documentData with pdfBuffer is provided
      if (documentData && documentData.pdfBuffer) {
        console.log("Using provided PDF buffer from documentData...");

        // Convert array buffer to Buffer if needed
        if (Array.isArray(documentData.pdfBuffer)) {
          pdfBuffer = Buffer.from(documentData.pdfBuffer);
        } else if (documentData.pdfBuffer instanceof ArrayBuffer) {
          pdfBuffer = Buffer.from(documentData.pdfBuffer);
        } else {
          pdfBuffer = documentData.pdfBuffer;
        }

        // Use provided fileName or generate default
        fileName =
          documentData.fileName ||
          `${type.toUpperCase()}_Policy_${policyId}.pdf`;

        console.log("PDF buffer size:", pdfBuffer.length);
        console.log("Using fileName:", fileName);

        // Validate that we received actual PDF data
        if (!pdfBuffer.toString("ascii", 0, 4).includes("%PDF")) {
          throw new Error(
            "Invalid PDF data provided in documentData - not a valid PDF file"
          );
        }
      } else {
        // Step 1: Retrieve PDF document from insurance API (existing logic)
        const insuranceApiUrl = `https://api.partners.dplinsurance.co.nz/insurance/generator/document/v2/retrieve/${policyId}`;

        console.log("Fetching PDF from insurance API...");
        const pdfResponse = await axios({
          method: "GET",
          url: insuranceApiUrl,
          headers: {
            ...headers,
            Accept: "application/octet-stream", // Explicitly accept octet-stream
          },
          responseType: "arraybuffer", // Keep as arraybuffer to handle binary data
          timeout: 30000,
        });

        if (!pdfResponse && !pdfResponse.data) {
          throw new Error("No PDF data received from insurance API");
        }

        console.log("PDF data received, size:", pdfResponse.data);

        // Convert arraybuffer to base64 for validation/logging if needed
        const base64Data = Buffer.from(pdfResponse.data).toString("base64");
        console.log("PDF converted to base64, length:", base64Data.length);

        // Validate that we received actual PDF data
        pdfBuffer = Buffer.from(pdfResponse.data);
        if (!pdfBuffer.toString("ascii", 0, 4).includes("%PDF")) {
          throw new Error("Invalid PDF data received - not a valid PDF file");
        }

        fileName = `${type.toUpperCase()}_Policy_${policyId}.pdf`;
      }

      const user = await Customer.findOne({
        token: HubspotData.securegateway_customer_name,
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid customer token" });
      }

      const customer_id = user.uid;
      const customer = await Customer.findOne({ uid: customer_id });

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const config_data = customer.get("file_configuration");
      const fileConfig = config_data.find(
        (config) => config.service_name === service
      );

      if (!fileConfig) {
        return res
          .status(404)
          .json({ message: "File configuration not found for service" });
      }

      // Step 3: Upload to S3 using the PDF buffer (from either source)
      const s3Client = new S3Client({
        region: fileConfig.region,
        credentials: {
          accessKeyId: fileConfig.access_key,
          secretAccessKey: fileConfig.secret_key,
        },
      });

      const folderName = `${customer_id}`;
      // Use the fileName determined above (either from documentData or generated)
      const filePath = `${config.BaseFolder}/Customer_Files/${folderName}/${dealId}/${fileName}`;

      const uploadParams = {
        Bucket: fileConfig.bucket_name,
        Key: filePath,
        Body: pdfBuffer, // Use the PDF buffer (from either documentData or API)
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="${fileName}"`,
      };

      console.log("Uploading to S3...");
      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log("PDF uploaded to S3 successfully", filePath);

      // Step 4: Create document record in HubSpot
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
              id: dealId, // Using dealId from the request
            },
          },
        ],
        properties: {
          document_id: policyId,
          document_name: `${type.toUpperCase()}${
            documentData?.pdfBuffer ? "_Declaration" : ""
          }_Policy`,
          document_type: "Autosure policy documents",
          is_esigned_document: "false",
          quote_page_link: filePath,
        },
      };

      if (filePath) {
        await axios({
          method: "POST",
          url: HubspotData?.document_retrieval_url,
          headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
          },
          data: documentRetrievalPayload,
        });
      }

      return res.json({
        status: "success",
        message: "Policy document processed successfully",
      });
    } catch (error) {
      console.error("Policy Document Error:", error.message);
      console.error("Stack trace:", error.stack);

      // Handle different types of errors
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);

        return res.status(error.response.status).json({
          error: "External API error",
          details: error.response.data,
          service: error.config?.url || "unknown",
        });
      } else if (error.request) {
        console.error("No response received:", error.request);
        return res.status(500).json({
          error: "No response from external service",
          details: error.message,
          timeout: error.code === "ECONNABORTED",
        });
      } else {
        return res.status(500).json({
          error: "Internal server error",
          details: error.message,
        });
      }
    }
  },
};

module.exports = proxyController;
