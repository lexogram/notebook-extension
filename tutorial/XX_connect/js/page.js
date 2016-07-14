"use strict"

;(function page(){
  var extensionId = "caojjneecknfaipddkpilpncmcipnkjd"
  var port = chrome.runtime.connect(extensionId)
  var message = { method: "startCounter" }
  var p = document.getElementById("connection")

  function incoming(message) {
    if (message.method === "ping") {
      p.innerHTML = message.counter
    }
  }

  port.onMessage.addListener(incoming)
  port.postMessage(message)
})()