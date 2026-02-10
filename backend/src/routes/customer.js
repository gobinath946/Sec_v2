const express = require("express");
const app = express.Router();
const customer = require("../controllers/customer");
const sessionMiddleware = require('../Libs/session');
const{ ROLES } = require("../Libs/heirachylevel");
const multer = require('multer');
const upload = multer(); 
const s3 = require("../Libs/s3customer");
const s3_3 = require("../Libs/s3customer3");


app.get("/customer/:user_uid",sessionMiddleware(ROLES.both), customer.getCustomer);
app.put("/customer/:user_uid",sessionMiddleware(ROLES.both), customer.updateCustomer);
app.get("/customers/:currentPage", sessionMiddleware(ROLES.both), customer.getAllCustomer);
app.get("/branding/:user_uid", sessionMiddleware(ROLES.both), customer.getBrandingData);
app.put("/branding/:user_uid", sessionMiddleware(ROLES.both), customer.updateBrandingData);
app.post("/manage_templates", customer.ManageTemplate);
app.put('/s3/files/:uid',upload.any(), s3.S3Upload);
app.put('/api/v2/s3/files/:uid',upload.any(), s3_3.S3Upload);



app.get('/s3/files/:uid/:page_name', s3.getImage);
app.get('/s3/templates/:uid/:page_name', s3.getFile);
app.post('/api/s3signed_url', s3.gets3fileUrl);
app.post('/api/s3signed_content_url', s3.gets3fileContentUrl);


module.exports = app;