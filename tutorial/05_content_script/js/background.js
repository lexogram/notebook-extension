"use strict"

;(function background(){

  var port

  function notify() {
    console.log.apply(console, arguments)
    alert(arguments[0])
  }

  function useExtension() {
    if (port) {
      return
    }
    
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


  function openConnection(externalPort) {
    //notify("openConnection", externalPort)
    port = externalPort
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
      //notify("NoteBook inactive. Request not treated:", request)
      return
    }

    port.postMessage(request)
  }

  // TODO: Add disconnect litene
  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
})()