const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const counter = require('./counter');

async function sendEmail2(email_service, senderEmail, senderPassword, to, subject, html, customer_id, attachments = [], cc = [], message_id, reply_to = null,from_name) {
    const type = "email_counts";
    const fromAddress = from_name ? `${from_name} <${senderEmail}>` : senderEmail;
    try {
        let transporter;
        let info;

        const toList = Array.isArray(to) ? to : [to];
        const ccList = Array.isArray(cc) ? cc : cc ? [cc] : [];
        
        // Handle reply_to - can be string, array of strings, or array of objects
        let replyToList = [];
        if (reply_to) {
            if (Array.isArray(reply_to)) {
                replyToList = reply_to.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (typeof item === 'object' && item.email) {
                        return item.email;
                    } else if (typeof item === 'object' && item.name && item.email) {
                        return `${item.name} <${item.email}>`;
                    }
                    return item;
                }).filter(Boolean);
            } else if (typeof reply_to === 'string') {
                replyToList = [reply_to];
            } else if (typeof reply_to === 'object' && reply_to.email) {
                replyToList = reply_to.name ? [`${reply_to.name} <${reply_to.email}>`] : [reply_to.email];
            }
        }
        
        const trackingData = {
            customer_id: customer_id || '',
            message_id: message_id || '',
            subject: subject || '',
            from: senderEmail || '',
            to: toList.join(';'),
            cc: ccList.join(';'),
            reply_to: replyToList.join(';'),
            timestamp: new Date().toISOString(),
            body_length: html ? html.length : 0,
            has_attachments: attachments.length > 0,
            attachment_count: attachments.length,
            service_type: email_service
        };

        if (email_service === 'Gmail') {
            transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: senderEmail,
                    pass: senderPassword
                }
            });
        } else if (email_service === 'Outlook') {
            transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: senderEmail,
                    pass: senderPassword
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                }
            });
        } else if (email_service === 'SendGrid') {
            sgMail.setApiKey(senderPassword);

            const processedAttachments = attachments.length > 0 ?
                attachments.map(att => ({
                    content: att.content.toString('base64'),
                    filename: att.filename,
                    type: att.contentType,
                    disposition: 'attachment',
                    contentId: att.cid
                })) : [];

            // Create custom headers with tracking data
            const customHeaders = {
                'X-Customer-ID': trackingData.customer_id,
                'X-Message-ID': trackingData.message_id,
                'X-Tracking-Data': Buffer.from(JSON.stringify(trackingData)).toString('base64')
            };

            const msg = {
                to: toList,
                cc: ccList,
                from:fromAddress,
                subject: subject,
                html: html,
                trackingSettings: {
                    clickTracking: { enable: true },
                    openTracking: { enable: true },
                    subscriptionTracking: { enable: false },
                    ganalytics: { enable: false }
                },
                customArgs: trackingData, // SendGrid custom arguments
                headers: customHeaders,
                ...(processedAttachments.length > 0 && { attachments: processedAttachments }),
                ...(replyToList.length > 0 && { replyTo: replyToList.length === 1 ? replyToList[0] : replyToList }) // Add reply-to for SendGrid
            };

            const info = await sgMail.send(msg);
            if (info[0] && info[0].statusCode === 202) {
                await counter(customer_id, type);
                return {
                    response: '250 OK - SendGrid accepted the message',
                    tracking_data: trackingData,
                    info
                };
            }

            return {
                error: 'SendGrid send failed',
                tracking_data: trackingData,
                info
            };
        } else {
            return {
                error: 'Unsupported email service',
                tracking_data: trackingData
            };
        }

        // Handle Gmail and Outlook email services
        if (email_service !== 'SendGrid') {
            const mailOptions = {
                from: fromAddress,
                to: toList.join(', '),
                cc: ccList.join(', '),
                subject: subject,
                html: html,
                ...(attachments.length > 0 && { attachments }),
                ...(replyToList.length > 0 && { replyTo: replyToList.join(', ') }), // Add reply-to for Gmail/Outlook
                headers: {
                    'X-Tracking-Info': JSON.stringify(trackingData)
                }
            };

            info = await transporter.sendMail(mailOptions);

            if (info && info.response && info.response.startsWith('250')) {
                await counter(customer_id, type);
            }

            return {
                ...info,
                tracking_data: trackingData
            };
        }

    } catch (error) {
        console.log('Email sending error:', error);
        return {
            error: `Failed to send email: ${error.message}`,
            error_details: error
        };
    }
}

module.exports = sendEmail2;