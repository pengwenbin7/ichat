const {app, BrowserWindow, ipcMain} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const crypto = require("crypto");
const Datastore = require("nedb");
const conf = require(path.join(__dirname, "conf.json"));
var socket = require("socket.io-client")("http://localhost:3333");

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let loginWin;
let win;
let userName;
let userId;
let room = null;

const db = new Datastore({filename: path.join(__dirname, "message", date()), autoload: true});
const cardDb = new Datastore({filename: path.join(__dirname, "vcard.db"), autoload: true});

socket.on("connect", () => {
  console.log("connected");
  socket.emit("csLogin", {
    id: userId,
    name: userName
  });
});

socket.on("message", (data) => {
  win.webContents.send("newMessage", data);
});

socket.on("waitList", (data) => {
  console.log(data);
});

socket.on("disconnect", () => {
  console.log("disconnect");
});



ipcMain.on("login", (event, arg) => {
  var access = validate(arg.name, arg.password);
  if (access) {
    mainWindow();
    loginWin.close();
  } else {
    event.returnValue = access;
  }
});

ipcMain.on("updateRoom", (event, arg) => {
  room = arg;
});

ipcMain.on("sendMsg", (event, arg) => {
  arg.from = userId;
  arg.to = room;
  socket.send(arg);
  console.log(arg);
  event.returnValue = null;
});

ipcMain.on("saveMessage", (event, arg) => {
  db.insert(arg, (err) => {
    event.returnValue = err;
  });
});

ipcMain.on("saveCard", (event, arg) => {
  cardDb.insert(arg, (err) => {
    console.log(err);
    event.returnValue = err;
  });
});

ipcMain.on("exit", (event, arg) => {
  app.quit();
});

function validate(name, pass) {
  var password = crypto.createHash("md5").update(name).digest("hex");
  return (pass === password || name === pass);
}

function loginWindow() {
  loginWin = new BrowserWindow({
    width: 450,
    height: 270,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "app.ico")
  });

  // load login.html。
  loginWin.loadURL(url.format({
    pathname: path.join(__dirname, "login.html"),
    protocol: "file:",
    slashes: true
  }));

  loginWin.on("closed", () => {
    loginWin = null;
  });
}

function mainWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "app.ico")
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true,
  }));

  // devtools
  win.webContents.openDevTools();

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", () => {
  if (conf.autologin) {
    userId = conf.id;
    userName = conf.name;
    mainWindow();
  } else {
    loginWindow();
  }
});

// 当全部窗口关闭时退出。
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    mainWindow();
  }
});

function date() {
  var d = new Date();
  var y = String(d.getFullYear());
  var m = d.getMonth() + 1;
  var day = d.getDate();

  m = m < 10 ? "0" + m : String(m);
  day = day < 10 ? "0" + day : String(day);

  return y + "-" + m + "-" + day;
}
