"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var host = "localhost";
var port = 8888;
var listener = function (req, res) {
    console.log(typeof req);
};
var server = http_1.default.createServer(listener);
server.listen(port);
