"use strict"

;(function content(){

  var selectedText = ""

  document.body.addEventListener("mouseup", checkSelection, false)
  document.body.addEventListener("keyup", checkSelection, false)

  function checkSelection(event) {
    var selection = document.getSelection()
    var text = selection.toString()

    if (selectedText !== text) {
      selectedText = text

      chrome.runtime.sendMessage({
        method: "changeSelection"
      , data: selectedText
      })
    }
  }
})()