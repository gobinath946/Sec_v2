const Customer = require("../../models/model").Customer;
const sendEmail2 = require("../../Libs/sendemail2");

const SendEmail = async (req, res) => {
  try {
    const { secret_key } = req.query;
    const { to, subject, body, cc, reply_to } = req.body;

    // Validate required fields
    if (!secret_key) {
      return res.status(400).json({ error: "secret_key is required in query parameters" });
    }

    if (!to) {
      return res.status(400).json({ error: "to field is required" });
    }

    if (!subject) {
      return res.status(400).json({ error: "subject field is required" });
    }

    if (!body) {
      return res.status(400).json({ error: "body field is required" });
    }

    // Fetch user based on token (secret_key)
    const user = await Customer.findOne({ token: secret_key });

    if (!user) {
      return res.status(404).json({ error: "Invalid secret_key. User not found." });
    }

    // Extract email configuration from user
    const emailConfigurations = user.get("email_configuration");
    
    if (!emailConfigurations || emailConfigurations.length === 0) {
      return res.status(400).json({ error: "No email configuration found for this user" });
    }

    let email_name, email_token, email_service, from_name;

    // Get the first available email configuration
    for (const config of emailConfigurations) {
      if (config) {
        email_name = config.user_name;
        email_token = config.password;
        email_service = config.service_name;
        from_name = config.from_name || "";
        break;
      }
    }

    if (!email_name || !email_token || !email_service) {
      return res.status(400).json({ error: "Email configuration is incomplete" });
    }

    // Get customer ID for tracking
    const customer_id = user.uid;

    // Convert plain text body to HTML if needed
    const htmlBody = body.replace(/\n/g, '<br>');

    // Send email using sendEmail2
    const emailResult = await sendEmail2(
      email_service,
      email_name,
      email_token,
      to,
      subject,
      htmlBody,
      customer_id,
      [], // attachments
      cc || [], // cc
      null, // message_id
      reply_to || null, // reply_to
      from_name
    );

    // Check if email was sent successfully
    if (emailResult.error) {
      return res.status(500).json({ 
        error: "Failed to send email", 
        details: emailResult.error 
      });
    }

    return res.status(200).json({ 
      message: "Email sent successfully",
      result: emailResult
    });

  } catch (error) {
    console.error("Error in SendEmail controller:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
};

module.exports = {
  SendEmail
};
