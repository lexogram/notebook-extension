"use strict"

;(function background(){

  var port
  var timeout = 0

  chrome.runtime.onConnectExternal.addListener(openConnection)

  function openConnection(externalPort) {
    port = externalPort
    port.onMessage.addListener(incoming)
  }

  function incoming(message) {
    if (timeout) {
      clearTimeout(timeout)
    }
    ping()
  }

  function ping() {
    port.postMessage({ method: "ping", counter: timeout })
    timeout = setTimeout(ping, 1000)
  }
})()