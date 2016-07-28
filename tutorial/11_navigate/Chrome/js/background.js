"use strict"

;(function background(){

  var port
  var injectedHTML = chrome.extension.getURL("html/inject.html")
  var injectedCSSFile = "css/inject.css"
  var extensionTabMap = {}
  var html

  ;(function getContentHTML() {
    var xhr = new XMLHttpRequest()
    xhr.open("GET", injectedHTML, true)
    xhr.onreadystatechange = stateChanged
    xhr.send()

    function stateChanged() {
      if (xhr.readyState === 4) {
        html = xhr.responseText
      }
    }
  })()

  function useExtension() {
    ensureNoteBookWindowIsOpen()

    chrome.tabs.query(
      { active: true
      , currentWindow: true
      }
    , showToolbarIfRequired)
  }

  function ensureNoteBookWindowIsOpen() {
    if (port) {
      return
    }

    var URL = "http://localhost:3000/"
    var width = 300
    var top = 0

    var options = {
      url: URL
    , left: screen.availWidth - width - 8
    , top: top
    , width: width
    , height: screen.availHeight - top
    , focused: false
    , type: "popup"
    }

    chrome.windows.create(options)
  }

  function showToolbarIfRequired(tabs) {
    var id = tabs[0].id
    var extensionIsActive = extensionTabMap[id] // true | false | 

    switch (extensionIsActive) {
      default: // undefined
        insertCSS(id)
        // fall throught to injectToolbar()
      case false:
        insertToolbar(id)
        extensionTabMap[id] = true
        // no need to break: nothing else happens
      case true:
        // do nothing: the Toolbar is already active
    }
  }

  function insertCSS(id) {  
    var cssDetails = {
      file: injectedCSSFile
    , runAt: "document_start"
    }
    chrome.tabs.insertCSS(id, cssDetails)
  }

  function insertToolbar(id) {
    var message = { 
      method: "insertToolbar"
    , html: html
    }

    chrome.tabs.sendMessage(id, message)
  }

  function openConnection(externalPort) {
    port = externalPort
    port.onMessage.addListener(incoming)
  }

  function incoming(message) {
    switch (message.method) {
      case "disableExtension":
        disableExtension()
      break
    }
  }

  function disableExtension() {
    chrome.tabs.query({}, callAllTabs)

    function callAllTabs(tabs) {
      var message = { method: "removeToolbar" }
      var total = tabs.length
      var ii
      
      for (ii = 0; ii < total; ii += 1) {
        chrome.tabs.sendMessage(tabs[ii].id, message)
      }

      port = null
    }
  }

  function treatMessage(request, sender, sendResponse) {
    switch (request.method) {
      case "changeSelection":
        changeSelection(request)
      break
      case "getExtensionStatus":
        getExtensionStatus(sender, sendResponse)
      break
      case "forgetExtension":
        forgetExtension(sender)
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

  function getExtensionStatus(sender, sendResponse) {
    var id = sender.tab.id
    var extensionIsActive = extensionTabMap[id] // true | !true

    if (!extensionIsActive) {
      extensionIsActive = checkUrlForMatch(sender.url) // true | false
    }

    if (extensionIsActive) {
      ensureNoteBookWindowIsOpen()
      insertCSS(id)
      insertToolbar(id)
      extensionTabMap[id] = true // if added by checkUrlForMatch()
    } else {
      // ensure that extensionTabMap[id] is undefined for when 
      // showToolbarIfRequired() is called next     
      delete extensionTabMap[id]
    }

    sendResponse({ extensionIsActive: extensionIsActive })

    function checkUrlForMatch(url) {
      var regex = /http:\/\/lx\// // FOR TESTING PURPOSES ONLY
      return !!regex.exec(url)
    }
  }

  function forgetExtension(sender) {
    extensionTabMap[sender.tab.id] = false
  }
  
  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
})()