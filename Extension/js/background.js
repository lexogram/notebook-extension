/** BACKGROUND **
 * 
 */


;(function background(){
  "use strict"

// // <TESTING
  window.SPEAK = function SPEAK(message) {
    
    var utterance = new SpeechSynthesisUtterance(message)
    window.speechSynthesis.speak(utterance)
    console.log(message)
  }
// // TESTING>

  var extension = {
    ports: {}
//, meteorURL: "http://localhost:3000/"
  , meteorURL: "http://localhost/NoteBook/main.html"
  // use your own local URL ^
  , injectedHTML: chrome.extension.getURL("html/inject.html")
  , injectedCSSFile: "css/inject.css"
  , tabMap: {}
  , googleTabId: 0
  , googleInitialized: false
  , nativeCode: "fr"
  , targetCode: "en"
  , selection: ""
  , word: ""
  
    /** Import injectedHTML for use in content pages */
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

    /** Set up connection with NoteBook's connection script */
  , openConnection: function openConnection(externalPort) {
      this.ports[externalPort.name] = externalPort
      externalPort.onMessage.addListener(treatMessage)

      if (this.googleTabId) {
        this.activateGooglePage(this.googleTabId)
      }
    }
  
    /** Called when browserAction button is clicked */
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

    /**
     * SOURCE: Called by the checkSelection method of the toolbar 
     *         object in the extension's content.js script
     * ACTION: Forwards the request to the NoteBook window, where the
     *         data string will be shown in the p#selection element.
     *         Sets the URL for the Google tab; when the page is
     *         loaded, 
     * @param  {object} request will be an object map with the format:
     *                          { method: "changeSelection"
     *                          , data: <string selected text>}
     */
  , changeSelection: function changeSelection(request) {
      if (!this.ports.notebook) {
        console.log("NoteBook inactive. Request not treated:",request)
        return
      }

      this.selection = request.data
      
      this.ports.notebook.postMessage(request)
      this.showInGoogleTab()
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
      this.ports.notebook.disconnect()
      delete this.ports.notebook
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
      if (this.ports.notebook) {
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
      
     
      if (tabId === this.googleTabId) {
        if (!tab) {
        // The Google Translate tab is closing
          this.googleTabId = 0
          this.googleInitialized = false

        } else if (!this.googleInitialized) {
          // Required the first time the a translation is requested
          if (changedInfo.status === "complete") {
            extension.activateGooglePage(tabId)
          }
        }
      }
    }

  , showInGoogleTab: function showInGoogleTab() { // NEW
      var options = {}

      if (!this.selection) {
        return
      }

      this.activateGooglePage(this.googleTabId)

      options.url = "https://translate.google.com/#"
      options.url += this.targetCode + "/" + this.nativeCode + "/"
      options.url += encodeURIComponent(this.selection)

      if (this.googleTabId) {
         chrome.tabs.update(this.googleTabId, options) //, setURL)
      } else {
         options.active = false
        chrome.tabs.create(options, tabOpened)
      }
      
      function tabOpened(tab) {
        extension.activateGooglePage(tab.id)
      }
    }

  , moveGoogleTabToFront: function moveGoogleTabToFront() {
      if (!this.googleTabId) {
        return
      }
      
      chrome.tabs.update(
        this.googleTabId
      , { "active": true
        , "highlighted": true
        }
      )
    }

  , activateGooglePage: function activateGooglePage(tabId) {
      extension.googleTabId = tabId

      chrome.tabs.sendMessage(
        tabId
      , { method: "activateTranslationSpan" }
      , function (result) {
          extension.googleInitialized = result
        }
      )
    }

  , showGoogleTranslation: function showGoogleTranslation(result) {
      if (this.ports.notebook) {
        this.ports.notebook.postMessage(result)
      }
    }

    // IFRAMES // IFRAMES // IFRAMES // IFRAMES // IFRAMES // IFRAMES
     
  , iFrameSetHeight: function setHeight(message, options) {
      var self = this
  
      if (message.height) {
        self.iFrameId = options.tab.id
        this.ports.notebook.postMessage(message)
      } else {
        chrome.tabs.sendMessage(self.iFrameId, message)
      }
    }

  , iFrameGetScrollTop: function iFrameGetScrollTop(message) {
      var self = this
      
      if (message.scrollTop) {
        this.ports.notebook.postMessage(message)
      } else {
        chrome.tabs.sendMessage(self.iFrameId, message)
      }
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
  chrome.tabs.onUpdated.addListener(tabChanged);
})()

