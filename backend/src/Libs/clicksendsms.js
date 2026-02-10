const axios = require('axios');
const counter = require('./counter');

async function sendSMS(sms_service, username, clicksend_token, messageBody, recipientMobile, sms_from, customer_id) {
    const type = "sms_counts";
    let response;
    try {
        if (sms_service === 'Clicksend') {
            response = await axios.post('https://rest.clicksend.com/v3/sms/send', {
                messages: [{
                    source: 'sdk',
                    from: sms_from,
                    body: messageBody,
                    to: recipientMobile
                }]
            }, {
                auth: {
                    username: username,
                    password: clicksend_token
                }
            });
            if (response.data.http_code === 200) {
                await counter(customer_id, type);
                return response.data;
            } else {
                return { error: 'Failed to send SMS' };
            }
        } else {
            return { error: 'Unsupported SMS service' };
        }
    } catch (error) {
        return { error: `Failed to send SMS: ${error.message}` };
    }
}

module.exports = sendSMS;
