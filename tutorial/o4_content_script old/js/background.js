"use strict"

;(function background(){

  var windowOpen = false
  var notebookTabId

  function useExtension() {
    if (windowOpen) {
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

    chrome.windows.create(options, callback)

    function callback(window_data) {
      windowOpen = true
    }
  }


  function treatMessage(request, sender, sendResponse) {
    switch (request.method) {
      case "registerNoteBookTabId":
        notebookTabId = sender.tab.id
      break
      case "changeSelection":
        changeSelection(request)
      break
    }
  }

  function changeSelection(request) {
    if (!notebookTabId) {
      console.log("NoteBook inactive. Request not treated:", request)
      return
    }

    chrome.tabs.sendMessage(notebookTabId, request)
  }

  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
})()