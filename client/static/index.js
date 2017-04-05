$(document).ready(function() {
  const {ipcRenderer} = nodeRequire("electron");

  var msg = {
    time: new Date().getTime(),
    from: "徐iqaa",
    to: "哦奥利",
    content: "奥在希拉里的尽可能"
  };
  console.log(ipcRenderer.sendSync("saveMessage", msg));
  
  $("a.exit").click(function() {
    ipcRenderer.sendSync("exit");
  });

  $("#card .submit").click(function() {
    var card = {};
    card.name = $("#card .name").val();
    card.company = $("#card .company").val();
    card.phone = $("#card .phone").val();
    card.note = $("#card .note").val();
    if (ipcRenderer.sendSync("saveCard", card)) {
      alert("成功保存名片");
    } else {
      alert("已存在，保存失败");
    }
  });
});
