const axios = require("axios");
const { Message } = require("../../models/model");

// Handler for clearing signatures based on deal_id
exports.clearSignature = async (req, res) => {
  const { deal_id } = req.params;

  if (!deal_id) {
    return res.status(400).json({
      status: "error",
      message: "No deal_id provided",
    });
  }

  try {
    // Find the message document where message_externalid matches deal_id
    const message = await Message.findOne({ message_externalid: deal_id });

    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "No message found with the provided deal_id",
      });
    }

    // Clear the signatures array
    message.signatures = [];
    await message.save();

    return res.json({
      status: "success",
      message: "Signatures cleared successfully",
      deal_id: deal_id,
    });
  } catch (error) {
    console.error("Error clearing signatures:", error.message);
    return res.status(500).json({
      status: "error",
      message: `Error clearing signatures: ${error.message}`,
    });
  }
};

// Handler for getting finance details from HubSpot
exports.getFinanceDetails = async (req, res) => {
  const { objectId, objectType, requestedProperties, api_key } = req.body || {};

  if (!objectId) {
    return res.status(400).json({
      status: "error",
      message: "No object ID provided",
    });
  }

  try {
    // Use properties from frontend or fallback to default properties
    const properties = requestedProperties || [
      "vehicle_price",
      "accessories",
      "dealer_fee",
      "lender_est_fee",
      "ppsr_fee",
      "other_charges",
      "monthly_fee",
      "trade_in_amount",
      "deposit_finance",
      "payout",
      "refund",
      "residual",
      "term_months",
      "payment_type",
      "finance_rate",
      "calculation_type",
      // Payment amounts
      "q_monthly",
      "q_fortnightly",
      "q_weekly",
      "net_amount_financed",
      // Package specific premium fields
      "q_gap_premium_d",
      "q_gap_premium_g",
      "q_ppi_per",
      "q_ppi_cover_d",
      "q_ppi_cover_p",
      "q_ppi_premium_d",
      "q_ppi_premium_p",
      "q_mbi_premium_d",
      "q_mbi_premium_p",
      "q_mbi_premium_g",
      "q_mbi_premium_s",
      // MBI specific fields
      "mbi_km",
      "mbi_electric",
      "mbi_type",
      "mbi_term",
      "mbi_excess",
      // Other insurance details
      "gap_option",
      "ppi_type",
      "customer_status",
    ];

    const url = `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}?properties=${properties.join(
      ","
    )}`;

    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: `Bearer ${api_key}`,
        "Content-Type": "application/json",
      },
    });

    // Convert API response to our expected structure
    const apiProperties = response.data.properties;
    const formattedProperties = {};

    // Map the properties from the API to our expected format with proper naming
    properties.forEach((prop) => {
      formattedProperties[prop] = apiProperties[prop] || "";
    });

    return res.json({
      status: "success",
      message: "Finance details retrieved successfully",
      properties: formattedProperties,
      recordId: objectId,
      recordType: objectType,
    });
  } catch (error) {
    console.error(
      "Error fetching finance details:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      status: "error",
      message: `Error fetching finance details: ${
        error.response?.data?.message || error.message
      }`,
      properties: {},
    });
  }
};



// Handler for updating finance details in HubSpot
exports.updateFinanceDetails = async (req, res) => {
  const { objectId, objectType, financeDetails, api_key } = req.body || {};

  if (!objectId) {
    return res.status(400).json({
      status: "error",
      message: "No object ID provided",
    });
  }

  if (!financeDetails) {
    return res.status(400).json({
      status: "error",
      message: "No finance details provided for update",
    });
  }

  try {
    const url = `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}`;

    // Format number values to have exactly 2 decimal places
    const propertiesToUpdate = {};

    // List of read-only properties that should not be updated
    const readOnlyProperties = ["vehicle_price"];

    // Add only editable properties to the update payload
    Object.keys(financeDetails).forEach((key) => {
      if (!readOnlyProperties.includes(key)) {
        // Format numeric values to have 2 decimal places
        const value = financeDetails[key];
        propertiesToUpdate[key] = value;
      }
    });

    const requestBody = {
      properties: propertiesToUpdate,
    };

    const response = await axios({
      method: "PATCH",
      url: url,
      headers: {
        Authorization: `Bearer ${api_key}`,
        "Content-Type": "application/json",
      },
      data: requestBody,
    });

    return res.json({
      status: "success",
      message: "Finance details updated successfully",
      recordId: objectId,
      recordType: objectType,
      updatedProperties: response.data.properties,
    });
  } catch (error) {
    console.error(
      "Error updating finance details:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      status: "error",
      message: `Error updating finance details: ${
        error.response?.data?.message || error.message
      }`,
    });
  }
};
