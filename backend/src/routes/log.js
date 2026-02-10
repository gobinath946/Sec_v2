const express = require("express");
const app = express.Router();
const log = require("../controllers/log");

app.post("/log_creation", log.createLogEntry);

module.exports = app;