var express = require("express");

var app = express();

app.listen(process.env.PORT, process.env.IP, function(req, res) {
    console.log("Server has started!");
});