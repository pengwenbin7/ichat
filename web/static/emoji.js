var emojiFlag = 0;

$(".emoji-pop").click(function() {
  editor.focus();
  if (emojiFlag) {
    $(".emoji-box").hide(400);
    emojiFlag = 0;
  } else {
    $(".emoji-box").show(400);
    emojiFlag = 1;
  }
});

$(".emoji-row>img").click(function() {
  pasteHtmlAtCaret(this.outerHTML);
});

// https://jsfiddle.net/Xeoncross/4tUDk/
function pasteHtmlAtCaret(html) {
  var sel, range;
  if (window.getSelection) {
    // IE9 and non-IE
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);

      // Just allow append content in editor area
      var p = range.startContainer.parentElement;
      if (p != $("div.chatInput").get(0) && p != $("#editor").get(0)) {
	return 0;
      }
      // My Fork End
      
      range.deleteContents();

      // Range.createContextualFragment() would be useful here but is
      // non-standard and not supported in all browsers (IE9, for one)
      var el = document.createElement("div");
      el.innerHTML = html;
      var frag = document.createDocumentFragment(), node, lastNode;
      while ( (node = el.firstChild) ) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      // Preserve the selection
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  } else if (document.selection && document.selection.type != "Control") {
    // IE < 9
    document.selection.createRange().pasteHTML(html);
  }
}
