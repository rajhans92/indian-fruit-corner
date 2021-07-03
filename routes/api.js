var express = require("express");
var authRouter = require("./auth");
var userRouter = require("./userManagement");

var app = express();

app.use("/auth/", authRouter);
app.use("/user/", userRouter);

module.exports = app;