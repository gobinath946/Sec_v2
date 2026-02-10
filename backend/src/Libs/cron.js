const cron = require('node-cron');
const Otp = require("../models/model").Otp;
const Token = require("../models/model").Token;
const Customer = require("../models/model").Customer;
const User = require("../models/model").User;
const axios = require('axios');
const sendEmail = require('./sendemail')
const status_code = require("./constants");


cron.schedule('*/5 * * * *', async () => {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    try {
        await Otp.updateMany({ created_at: { $lt: fiveMinutesAgo }, is_active: true }, { $set: { is_active: false } });
    } catch (error) {
        console.error(`Error deactivating expired OTPs: ${error.message}`);
    }
});

cron.schedule('0 0 * * *', async () => {
    try {
        await Otp.deleteMany({ is_active: false });
    } catch (error) {
        console.error(`Error deleting inactive OTPs: ${error.message}`);
    }
});

cron.schedule('0 0 * * *', async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
        await Token.deleteMany({ created_at: { $lt: twentyFourHoursAgo } });
    } catch (error) {
        console.error(`Error deleting tokens older than 24 hours: ${error.message}`);
    }
});




async function refreshSharePointAccessToken(customer) {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        refresh_token: customer.file_configuration.find(c => c.service_name === 'SharePoint').refresh_token,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default'
    });

    const response = await axios.post(tokenEndpoint, params);
    
    // Update customer document with new tokens
    await Customer.findOneAndUpdate(
        { 
            uid: customer.uid,
            'file_configuration.service_name': 'SharePoint'
        },
        {
            $set: {
                'file_configuration.$.access_token': response.data.access_token,
                'file_configuration.$.refresh_token': response.data.refresh_token
            }
        }
    );

    return response.data.access_token;
}

async function refreshDropboxAccessToken(customer) {
    const fileConfigurations = customer.file_configuration || customer.get("file_configuration");
    const dropboxConfigurations = fileConfigurations.filter(config => config.service_name === 'Dropbox');
    for (const config of dropboxConfigurations) {
        const { refresh_token, auth_code, client_id, secret_id } = config;
        try {
            const response = await axios.post(`https://api.dropbox.com/oauth2/token?grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${secret_id}`);
            const accessToken = response.data.access_token;
            config.access_key = accessToken;
            await customer.save();
        } catch (error) {
            console.error(`Error refreshing access token for customer ${customer._id}: ${error.message}`);
            try {
                const response = await axios.post(`https://api.dropbox.com/oauth2/token?code=${auth_code}&grant_type=authorization_code&client_id=${client_id}&client_secret=${secret_id}`);
                const newRefreshToken = response.data.refresh_token;
                config.refresh_token = newRefreshToken;
                await customer.save();
            } catch (error) {
                console.error(`Error obtaining refresh token for customer ${customer._id}: ${error.message}`);
            }
        }
    }
}

cron.schedule('0 */3 * * *', async () => {
    try {
        const customers = await Customer.find({});
        for (const customer of customers) {
            await refreshDropboxAccessToken(customer);
        }
    } catch (error) {
        console.error(`Error in cron job: ${error.message}`);
    }
});


const THRESHOLDS = {
    SEVENTY_PERCENT: 40,
    EIGHTY_FIVE_PERCENT: 25,
    NINETY_FIVE_PERCENT: 10,
    ZERO: 0
};

const emailService = status_code.FORGETEMAIL_SERVICE_NAME;
const senderEmail = status_code.FORGETEMAIL_USERNAME;
const senderPassword = status_code.FORGETEMAIL_TOKEN;
const to = status_code.CREDIT_NOTIFICATION_TO;
const cc = status_code.CREDIT_NOTIFICATION_CC;

cron.schedule('*/3 * * * * *', async () => {
    try {
        const customers = await Customer.find({});
        for (const customer of customers) {
            const customerId = customer.uid;
            const users = await User.find({ user_uid: customerId });

            for (const user of users) {
                const credits = user.credits;
                const userName = user.user_name;

                let lastNotifiedThreshold = user.last_notified_credit_threshold || 100;

                if (credits <= THRESHOLDS.SEVENTY_PERCENT && credits > THRESHOLDS.EIGHTY_FIVE_PERCENT && lastNotifiedThreshold > THRESHOLDS.SEVENTY_PERCENT) {
                    const subject = "Credits Usage Notification [SecureGateway]";
                    const text = `The Customer ${userName} has used 70% of SecureGateway credits. Now the current balance is ${credits} credits.`;
                    await sendEmail(emailService, senderEmail, senderPassword, to, subject, text, "SecureGateway", "", cc);
                    user.last_notified_credit_threshold = THRESHOLDS.SEVENTY_PERCENT;
                    user.notifiedAtZeroCredits = false;
                    await user.save();
                } else if (credits <= THRESHOLDS.EIGHTY_FIVE_PERCENT && credits > THRESHOLDS.NINETY_FIVE_PERCENT && lastNotifiedThreshold > THRESHOLDS.EIGHTY_FIVE_PERCENT) {
                    const subject = "Credits Usage Notification [SecureGateway]";
                    const text = `The Customer ${userName} has used 85% of SecureGateway credits. Now the current balance is ${credits} credits.`;
                    await sendEmail(emailService, senderEmail, senderPassword, to, subject, text, "SecureGateway", "", cc);
                    user.last_notified_credit_threshold = THRESHOLDS.EIGHTY_FIVE_PERCENT;
                    user.notifiedAtZeroCredits = false;
                    await user.save();
                } else if (credits <= THRESHOLDS.NINETY_FIVE_PERCENT && credits > THRESHOLDS.ZERO && lastNotifiedThreshold > THRESHOLDS.NINETY_FIVE_PERCENT) {
                    const subject = "Credits Usage Notification [SecureGateway]";
                    const text = `The Customer ${userName} has used 95% of SecureGateway credits. Now the current balance is ${credits} credits.`;
                    await sendEmail(emailService, senderEmail, senderPassword, to, subject, text, "SecureGateway", "", cc);
                    user.last_notified_credit_threshold = THRESHOLDS.NINETY_FIVE_PERCENT;
                    user.notifiedAtZeroCredits = false; 
                    await user.save();
                } else if (credits === THRESHOLDS.ZERO && !user.notifiedAtZeroCredits) {
                    const subject = "Credits Usage Notification [SecureGateway] - Service Stopped";
                    const text = `Credits have been completely used by the customer ${userName}. Please top up to continue using the service.`;
                    await sendEmail(emailService, senderEmail, senderPassword, to, subject, text, "SecureGateway", "", cc);
                    user.last_notified_credit_threshold = THRESHOLDS.ZERO;
                    user.notifiedAtZeroCredits = true;
                    await user.save();
                }
            }
        }
    } catch (error) {
        console.error(`Error in credits checking cron job: ${error.message}`);
    }
});




module.exports = cron;
module.exports.refreshDropboxAccessToken = refreshDropboxAccessToken;
module.exports.refreshSharePointAccessToken = refreshSharePointAccessToken;