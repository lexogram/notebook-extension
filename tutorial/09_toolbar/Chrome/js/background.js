"use strict"

;(function background(){

  var port
  // <HARD-CODED>
  var injectedHTML = chrome.extension.getURL("html/inject.html")
  var injectedCSSFile = "css/inject.css" // no getURL() needed
  // </HARD-CODED>

  function useExtension() {
    chrome.tabs.query(
      { active: true
      , currentWindow: true
      }
    , checkPageStatus)

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

    function checkPageStatus(tabs) {
      var id = tabs[0].id
      var message = { 
        method: "extensionStatus"
      }
      var html // set in customizeContentPage => stateChanged()

      chrome.tabs.sendMessage(id, message, checkExtensionStatus)

      function checkExtensionStatus(response) {
        if (!response.extensionIsActive) {
          customizeContentPage()
        }
      }

      function customizeContentPage() {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", injectedHTML, true)
        xhr.onreadystatechange = stateChanged
        xhr.send()

        function stateChanged() {
          if (xhr.readyState === 4) {
            html = xhr.responseText
            insertCSS()
            insertToolbar()
          }
        }
      }

      function insertCSS() {  
        var cssDetails = {
          file: injectedCSSFile
        , runAt: "document_start"
        }
        chrome.tabs.insertCSS(id, cssDetails, callback)

        function callback() {
          console.log("CSS injected")
        }
      }

      function insertToolbar() {
        var message = { 
          method: "insertToolbar"
        , html: html
        }

        function callback(response) {
          console.log("toolbar inserted", response)
        }

        chrome.tabs.sendMessage(id, message, callback)
      }
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