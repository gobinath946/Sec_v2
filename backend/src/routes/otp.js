const express = require("express");
const app = express.Router();
const otp = require("../controllers/otp");
const email = require("../controllers/forgetpassword")

app.post("/send_otp", otp.sendOTP);
app.post("/verify_otp", otp.verifyOTP);


app.post("/verify_email", email.verifyEmail);
app.post("/verify_pass", email.verifyOTP);
app.put("/update_password", email.updatePass);


module.exports = app;