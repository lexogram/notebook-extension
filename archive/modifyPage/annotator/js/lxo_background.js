"use strict"

;(function noteBookSettings(lx){
  chrome.browserAction.onClicked.addListener(activateExtension)
 
   var query = {
    active: true
  , currentWindow: true
  }

  // <HARD-CODED>
  var injectedHTML = chrome.extension.getURL("html/lxo_inject.html")
  var injectedCSSFile = "css/lxo_inject.css" // no getURL() needed
  // </HARD-CODED>

  function activateExtension() {
    chrome.tabs.query(query, initializeNoteBook)
    var notebookWindow = lx.getInstance("OpenWindow")
    notebookWindow.initialize()
  }
    
  function initializeNoteBook(tabs) {
    var id = tabs[0].id
    var html
    var languageMap

    ;(function getHTML() {
      var xhr = new XMLHttpRequest()
      xhr.open("GET", injectedHTML, true)
      xhr.onreadystatechange = stateChanged
      xhr.send()

      function stateChanged() {
  
        if (xhr.readyState === 4) {
          html = xhr.responseText
          showAnnotations()
        }
      }
    })()

    function showAnnotations() {
      getLanguages()
 
      function getLanguages() {
        var message = { 
          method: "getLanguages"
        }

        chrome.tabs.sendMessage(id, message, callback)

        function callback(response) {
          //console.log("languages", response)

          languageMap = window.getLanguageRegexMap(response.data)

          insertCSS()
          sendMessage()
        }
      }

      function insertCSS() {  
        var cssDetails = {
          file: injectedCSSFile
        , runAt: "document_start"
        }
        chrome.tabs.insertCSS(id, cssDetails, callback)

        function callback() {
          //console.log("CSS injected")
        }
      }

      function sendMessage() {
        var message = { 
          method: "showAnnotations"
        , html: html
        , languageMap: languageMap
        }

        function callback(response) {
          //console.log("message shown", response)
        }

        chrome.tabs.sendMessage(id, message, callback)
      }
    }
  }
})(lexogram)