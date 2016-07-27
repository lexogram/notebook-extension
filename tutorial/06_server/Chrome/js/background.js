"use strict"

;(function background(){

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
    // TODO
  }

  function treatMessage(request, sender, sendResponse) {
    switch (request.method) {
      case "changeSelection":
        changeSelection(request)
      break
    }
  }

  function changeSelection(request) {
    if (!port) {
      console.log("NoteBook inactive. Request not treated:", request)
      return
    }

    port.postMessage(request)
  }

  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
})()