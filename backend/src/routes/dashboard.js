const express = require("express");
const app = express.Router();
const dashboard = require("../controllers/dashboard");

app.get("/dashboard", dashboard.getDashBoardData);

module.exports = app;