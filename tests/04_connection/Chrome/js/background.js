"use strict"

;(function background(){

  var timeout = 0
  var port

  function useExtension() {
    if (!port) {
      openNoteBookWindow()
    }
    
    function openNoteBookWindow() {
      var URL = "http://localhost:3000/"
      var width = 300
      var top = 0

      var options = {
        url: URL
      , left: screen.availWidth - width
      , top: top
      , width: width
      , height: screen.availHeight - top
      , focused: false
      , type: "popup"
      }

      chrome.windows.create(options)
    }
  }

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

  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.browserAction.onClicked.addListener(useExtension)
})()