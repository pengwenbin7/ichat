"use strict";

var server = "http://192.168.188.107:3333";
var socket;
var editor;
var chatContent;
var audio;
var song;

$(document).ready(function() {
  // input area setting
  editor = $("#editor");
  editor.focus();

  chatContent = $(".chatContent");

  // click 'send' button to send message
  $(".send").mousedown(function() {
    send();
  });
  $(".send").mouseup(function() {
    clean();
  });

  // use ctrl + enter send message
  editor.keypress(function(event) {
    if (event.ctrlKey && (event.keyCode == 13 || event.keyCode == 10)) {
      send();
      clean();
    }
  });

  // send file by dropping
  $("#dropbox").change(function() {
    $(".tip-box").html("");
  });
  var dropbox = $("#dropbox").get(0);
  dropbox.addEventListener("dragenter", dragenter, false);
  dropbox.addEventListener("dragover", dragover, false);
  dropbox.addEventListener("drop", drop, false);
  // send file by click
  $(".emoji-file").click(function() {
    $("input[type=file]").click();
  });
  $("input[type=file]").change(function() {
    handleFiles(this.files);
  });

  // init socket.io server
  socket = io(server);
  socket.on("connect", function() {
    socket.emit("visitorLogin");
  });

  socket.on("message", function(msg) {
    handleMsg(msg);
  });

  socket.on("disconnect", function() {
    // alert("服务端主动断开了连接");
  });

});

// send and recieve message
function send() {
  var html = editor.html().trim();
  if (!html) {
    return false;
  }
  var msg = {
    type: "message",
    content: html
  };
  console.log(msg);
  socket.send(msg);
}

// handle recieved message
function handleMsg(msg) {
  playSong("msg");
  var html = ['<div class="mine">', '<span class="contentName">',
    msg.from, " ", msg.time, '</span>', '<pre class="message">',
    msg.content, '</pre></div>'];
  html = $(html.join(""));
  chatContent.append(html);
  chatContent.scrollTop(chatContent.get(0).scrollHeight);
}

function clean() {
  editor.text("");
  editor.focus();
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  var dt = e.dataTransfer;
  var files = dt.files;
  handleFiles(files);
}



function handleFiles(files) {
  var file;
  for (var i = 0; i < files.length; i++) {
    file = files[i];
    if (file.size > 16777216 || file.size <= 0) {
      alert("仅支持小于16M的文件");
      return false;
    }
    var msg = {
      name: file.name,
      type: file.type,
      content: file
    };
    socket.emit("bin", msg, function(err) {
      if (err) {
	alert(JSON.stringify(err));
      }
    });
  }
}

function playSong(type) {
  audio = $("audio." + type);
  song = audio.get(0);
  song.play();
}

/*
   function parseCookie(c) {
   var obj = {};
   var arr = [];
   var a = [];
   if (!c) {
   // ignore
   } else if (-1 == c.indexOf(";")) {
   a = c.split("=");
   obj[a[0].trim()] = a[1].trim();
   } else {
   arr = c.split(";");
   arr.forEach(function(v) {
   // a=hello, b=world
   a = v.split("=");
   obj[a[0].trim()] = a[1].trim();
   });
   }
   return obj;
   }
 */
