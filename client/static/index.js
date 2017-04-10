$(document).ready(function() {
  const {ipcRenderer} = nodeRequire("electron");
  
  $("a.exit").click(function() {
    ipcRenderer.sendSync("exit");
  });

  ipcRenderer.on("newMessage", (event, msg) => {
    console.log(msg);
  });

  $("button.send").click(() => {
    var html = $("pre").html();
    var msg = {
      time: new Date().getTime(),
      content: html
    };
    ipcRenderer.sendSync("sendMsg", msg);
  });
  
  $("#card .submit").click(function() {
    var card = {};
    card.name = $("#card .name").val();
    card.company = $("#card .company").val();
    card.phone = $("#card .phone").val();
    card.note = $("#card .note").val();
    if (ipcRenderer.sendSync("saveCard", card)) {
      alert("保存失败");
    } else {
      alert("成功保存名片");
      $("#card input").val("");
      $("#card .name").focus();
    }
  });
});
