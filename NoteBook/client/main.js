
Meteor.startup(function() {
  var extensionId = "lfghaadcpbfjiabgmpdnejbmkknfnlpn"
  var port = chrome.runtime.connect(extensionId)

  var p = document.getElementById("selection")
  var message = { method: "startCounter" }

  function incoming(message) {
    if (message.method === "ping") {
      p.innerHTML = message.counter
    }
  }

  port.onMessage.addListener(incoming)

  setTimeout(function () {
    port.postMessage(message)
  }, 1)
})