"use strict";

// instance a socket.io server
const fs = require("fs");
const http = require("http").createServer();
const io = require("socket.io")(http);
const ini = require("ini");
const crypto = require("crypto");
const request = require("request");
const nedb = require("nedb");
const path = require("path");
const PORT = 3333;
const conf = ini.parse(fs.readFileSync(__dirname + "/conf.ini", "utf-8"));
const db = require(__dirname + "/src/db.js")(conf.db);
const logger = require(__dirname + "/src/log.js");
const log  = logger.log(conf.log);
const types = ["cs", "visitor"];

var waitList = new Map();
var csList = new Map();
var cacheList = new Map();

io.on("connection", function(client) {

  let type;
  let room;
  let id;
  let name;
  let rid;
  let onChat = null;

  // customer service login
  client.on("csLogin", (data) => {
    id = data.id;
    room = client.id;
    name = data.name;
    csList.set(client.id, {
      id: id,
      name: name
    });
    type = types[0];

    console.log("emit waitList", waitList);
    client.emit("waitList", "list:...");
  });

  // update room
  client.on("updateRoom", (newRoom) => {
    room = newRoom;
  });

  // visitor login
  client.on("visitorLogin", () => {
    var ip = client.handshake.address.slice(7);
    //ipInfo(ip).then((info) => {});
    id = ip2long(ip);
    name = ip;
    type = types[1];
    room = client.id;
    rid = id;
    
    waitList.set(client.id, {
      id: id,
      name: name,
      type: type,
      room: room
    });
    console.log(waitList);
    console.log(csList);
  });

  client.on("message", (data) => {
    var time = logger.timeFormat();
    var msg = {
      type: "message",
      from: name,
      time: time,
      content: data.content
    };
    db.query("insert into sdb_im_message (`from`, `to`, `type`, `content`, `time`) values (?, ?, ?, ?, ?)", [id, id, "text", data.content, new Date(time).getTime() * 1 / 1000]);
    client.send(msg);
    if (onChat) {
      // send message to customer service
      client.to(room).send(msg);
    } else {
      // save message
      cacheMsg(room, msg);
      fetchMsg(room);
    }
  });

  client.on("bin", (data, fn) => {
    var time = logger.timeFormat();
    var file = conf.resource.dir + data.name;
    fs.writeFile(file, data.content, (err) => {
      if (err) {
	log.error(err);
	fn(err);
      } else {
	var fileUri = '<a href="' + conf.resource.prefix + data.name + '">' + data.name + '</a>';
	var msg = {
	  type: "message",
	  from: name,
	  time: time,
	  content: fileUri
	};
	db.query("insert into sdb_im_message (`from`, `to`, `type`, `content`, `time`) values (?, ?, ?, ?, ?)", [id, rid, "bin", fileUri, new Date(time).getTime() * 1 / 1000]);
	client.to(room).send(msg);
	client.send(msg);
      }
    });
  });

  // close connection
  client.on("disconnect", function() {
    if (waitList.has(client.id)) {
      waitList.delete(client.id);
    } else if (csList.has(client.id)) {
      csList.delete(client.id);
    }
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
  /*
  var option = {
    uri: "http://ip.taobao.com/service/getIpInfo.php?ip=" + ip,
    json: true
  };
  return new Promise((resolve, reject) => {
    request.get(option, (err, res, body) => {
      var info = body.data.country + body.data.region + body.data.city;
      resolve(info);
    });
  });
  */
  return ip;
}

function cacheMsg(room, msg) {
  var cache;
  if (cacheList.has(room)) {
    cache = cacheList.get(room);
  } else {
    cache = new nedb({ filename: path.join(__dirname, "cache", room), autoload: true });
    cacheList.set(room, cache);
  }
  cache.insert(msg);
}

function fetchMsg(room) {
  var cache;
  if (cacheList.has(room)) {
    cache = cacheList.get(room);
    cache.find({}, (err, docs) => {
      console.log(docs);
      cacheList.delete(room);
      fs.unlinkSync(path.join(__dirname, "cache", room));
    });
  } else {
    return false;
  }
}
