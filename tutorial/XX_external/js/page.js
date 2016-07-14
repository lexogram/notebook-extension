"use strict"

;(function page(){
  // The ID of the extension we want to talk to.
  var editorExtensionId = "jajdfkfpbajapgmlfcfmdkflchellegf"
  var message = { test: "from page"}


  function notify() {
    console.log.apply(console, arguments)
    alert(arguments[0])
  }

  function callback(response) {
    notify("External connection callback", response)
  }

  // Make a simple request:
  chrome.runtime.sendMessage(editorExtensionId, message, callback)
})()