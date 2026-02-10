const express = require("express");
const app = express.Router();
const user = require("../controllers/users");
const sessionMiddleware = require('../Libs/session');
const{ ROLES } = require("../Libs/heirachylevel");
 

app.get("/user/:user_uid",sessionMiddleware(ROLES.both), user.getUser);
app.get("/users/:currentPage", sessionMiddleware(ROLES.both), user.getAllUser);

app.get("/hubspot/jwt_token", user.getJwtToken);

app.post("/user",sessionMiddleware(ROLES.both), user.createuser);
app.post("/login", user.Login);
app.post("/logout/:email_id", user.logout);
 
app.put("/user/:user_uid",sessionMiddleware(ROLES.both), user.updateUser);
app.delete("/user/:user_uid",sessionMiddleware(ROLES.both), user.deleteUser);

module.exports = app;