"use strict"

;(function background(){

  var extension = {
    port: null
//, meteorURL: "http://localhost:3000/"
  , meteorURL: "http://localhost/NoteBook/main.html"
  // use your own local URL ^
  , injectedHTML: chrome.extension.getURL("html/inject.html")
  , injectedCSSFile: "css/inject.css"
  , tabMap: {}
  // NEW
  , googleTabId: 0
  , nativeCode: "en"
  , targetCode: "en"
  , selection: ""
  , word: ""
  

  , initialize: function initialize() {
      var xhr = new XMLHttpRequest()
      xhr.open("GET", this.injectedHTML, true)
      xhr.onreadystatechange = stateChanged
      xhr.send()

      return this

      function stateChanged() {
        if (xhr.readyState === 4) {
          extension.injectedHTML = xhr.responseText
        }
      }
    }

  , openConnection: function openConnection(externalPort) {
      this.port = externalPort
      this.port.onMessage.addListener(treatMessage)
    }
  
  , useExtension: function useExtension() {
      this.ensureNoteBookWindowIsOpen()

      chrome.tabs.query(
        { active: true
        , currentWindow: true
        }
      , function (tabs) {
          extension.showToolbarIfRequired.call(extension, tabs)
        }
      )
    }

    // treatMessage // treatMessage // treatMessage // treatMessage //

  , changeSelection: function changeSelection(request) {
      if (!this.port) {
        console.log("NoteBook inactive. Request not treated:", request)
        return
      }

      // NEW
      this.selection = request.data
      
      this.port.postMessage(request)
      this.showInGoogleTab() // NEW
    }

  , showInGoogleTab: function showInGoogleTab() { // NEW
      var string = encodeURIComponent(this.selection)
      var options = {}

      if (!string) {
        return
      }

      options.url = "https://translate.google.com/#"
      options.url += this.targetCode + "/" + this.nativeCode + "/"
      options.url += string

  //  options.pinned = false
  //  options.openerTabId = 0 // id of this tab

      if (this.googleTabId) {
    //  options.highlighted = false
    //  options.muted = false
        chrome.tabs.update(this.googleTabId, options) //, setURL)
      } else {
    //  options.windowId = 0 // id of popup window  
    //  options.index = 1 // position in window     
        options.active = false
        chrome.tabs.create(options, tabOpened)
      }
      
      function tabOpened(tab) {
        //console.log("Google tabOpened - id:", tab.id, "windowId", tab.windowId)
        extension.googleTabId = tab.id
        chrome.tabs.sendMessage(
          tab.id
        , { method: "activateTranslationSpan" }
        )
      }

      // function setURL(tab) {
      //   console.log("setURL", tab.url)
      // }
    }

  , getExtensionStatus: function getExtensionStatus(request, sender, sendResponse) {
      var id = sender.tab.id
      var extensionIsActive = this.tabMap[id] // true | !true

      if (!extensionIsActive) {
        extensionIsActive = this.checkUrlForMatch(sender.url)
        // true | false
      }

      if (extensionIsActive) {
        this.ensureNoteBookWindowIsOpen()
        this.insertCSS(id)
        this.insertToolbar(id)
        this.tabMap[id] = true
        // if added by checkUrlForMatch()
      } else {
        // ensure that tabMap[id] is undefined for when 
        // showToolbarIfRequired() is called next     
        delete this.tabMap[id]
      }

      sendResponse({ extensionIsActive: extensionIsActive })
    }

  , forgetExtension: function forgetExtension(request, sender) {
      this.tabMap[sender.tab.id] = false
    }

  , disableExtension: function disableExtension() {
      this.port = null
      chrome.tabs.query({}, callAllTabs)

      function callAllTabs(tabs) {
        var message = { method: "removeToolbar" }
        var total = tabs.length
        var ii
        
        for (ii = 0; ii < total; ii += 1) {
          chrome.tabs.sendMessage(tabs[ii].id, message)
        }
      }
    }

  , getFrequencyData: function getFrequencyData(request, sender) {
      // { method: "getFrequencyData"
      // , data: textContent }
      request.id = sender.tab.id

      ;(function postMessageWhenPortIsOpen(){
        if (extension.port) {
          extension.port.postMessage(request)
        } else {
          setTimeout(postMessageWhenPortIsOpen, 10)
        }
      })()
    }

  , treatFrequencyData: function treatFrequencyData(request) {     
      // { method: "treatFrequencyData"
      // , data: <array of word frequencies>
      // , id: <original sender id> }

      chrome.tabs.sendMessage(request.id, request)
    }

  , setLanguages: function setLanguages(languageMap) { // NEW
      this.nativeCode = languageMap.nativeCode
      this.targetCode = languageMap.targetCode
      
      this.showInGoogleTab()
    }

    // INSTALLATION // INSTALLATION // INSTALLATION // INSTALLATION //

  , ensureNoteBookWindowIsOpen: function ensureNoteBookWindowIsOpen() {
      if (this.port) {
        return
      }

      var width = 300
      var top = 0

      var options = {
        url: this.meteorURL
      , left: screen.availWidth - width
      , top: top
      , width: width
      , height: screen.availHeight - top
      , focused: false
      , type: "popup"
      }

      chrome.windows.create(options)
    }

   , showToolbarIfRequired: function showToolbarIfRequired(tabs) {
      var id = tabs[0].id
      var extensionIsActive = this.tabMap[id] // true|false|

      switch (extensionIsActive) {
        default: // undefined
          this.insertCSS(id)
          // fall throught to injectToolbar()
        case false:
          this.insertToolbar(id)
          this.tabMap[id] = true
          // no need to break: nothing else happens
        case true:
          // do nothing: the Toolbar is already active
      }
    }

  , insertCSS: function insertCSS(id) {  
      var cssDetails = {
        file: this.injectedCSSFile
      , runAt: "document_start"
      }
      chrome.tabs.insertCSS(id, cssDetails)
    }

  , insertToolbar: function insertToolbar(id) {
      var message = { 
        method: "insertToolbar"
      , html: this.injectedHTML
      }

      chrome.tabs.sendMessage(id, message)
    }

  , tabChanged: function tabChanged(tabId, changedInfo, tab) { // NEW
      // <changedInfo> may be:
      // * { isWindowClosing: <boolean, windowId: <integer> }
      //   if call triggered by chrome.tabs.onRemoved
      // * one of ...
      //   { status: "loading", url: <url string> }
      //   { title: "Google Translate" }
      //   { status: "complete" }
      //   { favIconUrl: "https...favicon.ico" }
      //   if call triggered by chrome.tabs.onUpdate
      
      //console.log(changedInfo.status)

      if (tabId === this.googleTabId) {
        if (!tab) {
        // The Google Translate tab is closing
          this.googleTabId = 0
        } else if (changedInfo.status === "complete") {
          chrome.tabs.sendMessage(
            tabId
          , { method: "getGoogleTranslation"}
          , function (result) {
              extension.showGoogleTranslation.call(extension, result)
            });
        }
      }
    }

  , showGoogleTranslation: function showGoogleTranslation(result) {
      var request = {
        method: "showGoogleTranslation"
      , result: result
      }

      this.port.postMessage(result)
    }

    // PLACEHOLDER // PLACEHOLDER // PLACEHOLDER // PLACEHOLDER //

  , checkUrlForMatch: function checkUrlForMatch(url) {
      var regex = /http:\/\/lexogram\.github\.io\/openbook\//
      return !!regex.exec(url)
    }
  }.initialize()

  // LISTENERS // LISTENERS // LISTENERS // LISTENERS // LISTENERS // 

  function openConnection(externalPort) {
    extension.openConnection.call(extension, externalPort)
  }

  function useExtension() {
    extension.useExtension.call(extension)
  }

  function tabChanged(tabId, changedInfo, tab) { // NEW
    extension.tabChanged.call(extension, tabId, changedInfo, tab)
  }

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method]
    if (typeof method === "function") {
      method.call(extension, request, sender, sendResponse)
    }
  }
  
  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
  chrome.tabs.onRemoved.addListener(tabChanged) // NEW
  //chrome.tabs.onUpdated.addListener(tabChanged);
})()