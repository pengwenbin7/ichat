"use strict";

// instance a socket.io server
const fs = require("fs");
const http = require("http").createServer();
const io = require("socket.io-client")(http);
const ini = require("ini");
const crypto = require("crypto");
const request = require("request");

const PORT = 3333;

var conf = ini.parse(fs.readFileSync(__dirname + "/conf.ini", "utf-8"));
const db = require(__dirname + "/src/db.js")(conf.db);
const logger = require(__dirname + "/src/log.js");
const log  = logger.log(conf.log);

var waitList = new Array();
var csList = new Array();
const types = ["cs", "visitor"];
var type;
var room;
var id;
var name;

io.on("connection", function(client) {

  var ip = client.handshake.address.slice(7);
  // customer service login
  client.on("csLogin", (data) => {
    id = data.id;
    name = data.name;
    csList[client.id] = data;
    type = types[0];

    var info = {
      type: "info",
      content: waitList,
      time: logger.timeFormat()
    };
    client.send(info);
  });

  // visitor login
  client.on("visitorLogin", () => {
    id = ip2long(ip);
    ipInfo(ip).then((info) => {
      name = info;
    });
    type = types[1];
    room = client.id;
  });

  // close connection
  client.on("disconnect", function() {
    //
  });
});

// listen ports
http.listen(PORT, () => {
  console.log("listening on*:", PORT);
});

// hash digest, default algo is "sha1"
/*
   function hash(str, algo = "sha1") {
   return crypto.createHash(algo).update(str).digest("hex");
   }
 */

function ip2long(ip) {
  var longValue = 0;
  var multipliers = [0x1000000, 0x10000, 0x100, 1];
  ip.split('.').forEach(function(part, i) {longValue += part * multipliers[i];});
  return longValue;
}

function ipInfo(ip) {
  var option = {
    uri: "http://ip.taobao.com/service/getIpInfo.php?ip=" + "121.227.39.6",
    json: true
  };
  return new Promise((resolve, reject) => {
    request.get(option, (err, res, body) => {
      var info = body.data.country + body.data.region + body.data.city;
      resolve(info);
    });
  });
}
