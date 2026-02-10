const express = require("express");
const app = express.Router();
const multer = require('multer');
const upload = multer(); 
const upload1 = multer({ dest: 'uploads/' });
const workorder = require("../controllers/message");
const distribution = require("../controllers/distribution");
const fileupload = require("../controllers/filehandling");

app.get('/message/:uid', workorder.getMessageById);
app.get('/message_branding/:uid', workorder.getResultBranding);
app.get('/message_history/:message_externalid/:recipient_externalid', workorder.getStatusHistoryByExternalIds);
app.post('/securegateway/message_history/:message_externalid', workorder.getMessageData);
app.put('/message/files/:uid',upload.any(), fileupload.updateFiles);
app.post('/doc_text', upload1.single('file'), workorder.DocToText);
app.post('/doc_html', upload1.single('file'), workorder.DocToHtml);
app.post('/distribution/:token', distribution.createMessage);
app.post('/link_distributor', workorder.LinkDistributor);
app.post('/get_hubspot_html', workorder.UrlToHtml);

module.exports = app;


