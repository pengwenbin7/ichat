"use strict";

// instance a socket.io server
const fs = require("fs");
//const bodyParser = require("body-parser");
const http = require("http").createServer();
const io = require("socket.io")(http);
//const vIo = require("socket.io")(http);
const ini = require("ini");
const crypto = require("crypto");

const PORT = 3000;
//const PORT_VISITOR = 3333;

var conf = ini.parse(fs.readFileSync(__dirname + "/conf.ini", "utf-8"));
const db = require(__dirname + "/src/db.js")(conf.db);
const logger = require(__dirname + "/src/log.js");
const log  = logger.log(conf.log);


// client id to user name
var cid2name = new Map();
// online user list
var onlineList = [];
var waitList = new Map();
var visitorList = new Array();

io.on("connection", function(cli) {
  var id;
  var name;
  var room;
  var rid;
  var client = cli;
  var friends = [];

  // user login
  client.on("login", (data) => {
    id = data.id;
    rid = data.rid;
    name = data.name;
    room = data.room;

    cid2name.set(client.id, name);

    if (!onlineList[rid]) {
      onlineList[rid] = new Set();
    }

    client.join(room, () => {
      // add user to online list
      onlineList[rid].add(name);
      log.info(id + " join in " + rid);
      var msg = {
	type: "broadcast",
	time: logger.timeFormat(),
	content: name + "加入了房间" + room
      };
      client.to(room).send(msg);

      friends = [];
      onlineList[rid].forEach((e) => {
	friends.push(e);
      });
      var info = {
	type: "info",
	content: friends,
	time: logger.timeFormat()
      };
      client.to(room).send(info);
      client.send(info);
    });
  });

  client.on("visitorLogin", (data) => {
    id = data.id;
    rid = data.rid;
  });

  client.on("change", (data) => {
    onlineList[rid].delete(name);
    client.leave(room, () => {
      rid = data.rid;
      room = data.room;
      client.join(room, () => {
	// add user to online list
	onlineList[rid].add(name);
	log.info(id + " join in " + rid);
	var msg = {
	  type: "broadcast",
	  time: logger.timeFormat(),
	  content: name + "加入了房间" + room
	};
	client.to(room).send(msg);

	friends = [];
	onlineList[rid].forEach((e) => {
	  friends.push(e);
	});
	var info = {
	  type: "info",
	  content: friends,
	  time: logger.timeFormat()
	};
	client.to(room).send(info);
	client.send(info);
      });
    });
  });

  // recieve text message
  client.on("message", function(data) {
    var time = logger.timeFormat();
    var msg;
    switch (data.type) {
      case "auth":
	break;
      case "message":
	msg = {
	  type: "message",
	  from: name,
	  time: time,
	  content: data.content
	};
	db.query("insert into sdb_im_message (`from`, `to`, `type`, `content`, `time`) values (?, ?, ?, ?, ?)", [id, rid, "text", data.content, new Date(time).getTime() * 1 / 1000]);
	client.to(room).send(msg);
	client.send(msg);
	break;
      case "change":
	break;
      default:
	break;
    }
  });

  // recieve binary file
  client.on("bin", function(data, fn) {
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
	db.query("insert into sdb_im_message (`from`, `to`, `type`, `content`, `time`) values (?, ?, ?, ?, ?)", [id, room, "bin", fileUri, new Date(time).getTime() * 1 / 1000]);
	client.to(room).send(msg);
	client.send(msg);
      }
    });
  });

  // close connection
  client.on("disconnect", function() {
    onlineList[rid].delete(name);
    log.info(id + " leave " + room);
    var msg = {
      type: "broadcast",
      time: logger.timeFormat(),
      content: name + "离开了房间" + room
    };
    client.to(room).send(msg);
    friends = [];
    onlineList[rid].forEach((e) => {
      friends.push(e);
    });
    var info = {
      type: "info",
      content: friends,
      time: logger.timeFormat()
    };
    client.to(room).send(info);
  });
});

/*
vIo.on("connection", function(client) {
  visitorList[client.id] = client;
});
*/

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
