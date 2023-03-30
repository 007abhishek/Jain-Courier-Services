//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/Network", function (req, res) {
  res.render("network");
});

app.get("/Service", function (req, res) {
  res.render("service");
});

app.get("/Solution", function (req, res) {
  res.render("solution");
});

app.get("/About", function (req, res) {
  res.render("about");
});

app.get("/Login", function (req, res) {
  res.render("login");
});

app.get("/Track", function (req, res) {
  res.render("track");
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
