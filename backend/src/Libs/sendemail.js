const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const counter = require('./counter');

async function sendEmail(email_service, senderEmail, senderPassword, to, subject, html, customer_id, attachments = [], cc,from_name) {
    const fromAddress = from_name ? `${from_name} <${senderEmail}>` : senderEmail;
    const type = "email_counts";
    try {
        let transporter;

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
            
            const msg = {
                to: Array.isArray(to) ? to : [to],
                cc: Array.isArray(cc) ? cc : cc ? [cc] : [],
                 from: fromAddress,
                subject: subject,
                html: html,
                attachments: attachments.map(att => ({
                    content: att.content.toString('base64'),
                    filename: att.filename,
                    type: att.contentType,
                    disposition: 'attachment',
                    contentId: att.cid
                }))
            };
            
            let info = await sgMail.send(msg);
            
            if (info[0] && info[0].statusCode === 202) {
                await counter(customer_id, type);
            }
            return info;
        } else {
            return { error: 'Unsupported email service' };
        }

        if (email_service !== 'SendGrid') {
            let info = await transporter.sendMail({
                from: fromAddress,
                to: Array.isArray(to) ? to.join(', ') : to,
                cc: Array.isArray(cc) ? cc.join(', ') : cc,
                subject: subject,
                html: html,
                attachments: attachments
            });

            if (info && info.response && info.response.startsWith('250')) {
                await counter(customer_id, type);
            }
            return info;
        }

    } catch (error) {
        console.log(error);
        return { error: `Failed to send email: ${error.message}` };
    }
}

module.exports = sendEmail;
