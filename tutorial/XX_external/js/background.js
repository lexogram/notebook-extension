"use strict"

;(function background(){

  chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    notify("External message received", request)
    sendResponse({ background: "response" })
  });

  function notify() {
    console.log.apply(console, arguments)
    alert(arguments[0])
  }
})()