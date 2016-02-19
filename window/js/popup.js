"use strict"

;(function popup(lx) {
  //lx.speak("popup")

  lx.addConstructor(Popup)

  var that
  var URL = chrome.extension.getURL("html/lx-content.html")

  function Popup () {
    //lx.speak("initializing popup")
    that = this
  }

  /** Use a separate initialize() method so that all prototype
   *  methods have been attached to the new object.
   */
  Popup.prototype.initialize = function initialize(dependencies) {
    var width = 300
    var top = 0
    var rect = {
      left: screen.availWidth - width
    , top: top
    , width: width
    , height: screen.availHeight - top
    }
    var options = {
      url: URL
  //, tabId
    , left: rect.left
    , top: rect.top
    , width: rect.width
    , height: rect.height
    , focused: false
  //, incognito: false
    , type: "popup" //"normal"|"detached_panel"|"panel"//<experimental
  //, state: "normal" //"minimized"|"maximized"|"fullscreen"|"docked"
    }

    this.tabTracker = dependencies.tabTracker 
    this.tabId = undefined // set in windowCreated()

    chrome.windows.create(options, function callback(window_data) {
      that.windowCreated.call(that, window_data)
    })
  }
  
  Popup.prototype.windowCreated = function windowCreated(window_data) {
  /*
    window_data = {
      alwaysOnTop: false
    , focused: true
    , height: 777
    , id: 47
    , incognito: false
    , left: 67
    , state: "maximized"
    , tabs: [
        {
          active: true
        , audible: false
        , height: 755
        , highlighted: true
        , id: 48
        , incognito: false
        , index: 0
        , muted: false
        , mutedCause: ""
        , pinned: false
        , selected: true
        , status: "loading"
        , title: ""
        , url: ".../lx-content.html"
        , width: 300
        , windowId: 47
        }
      ]
    , top: 23
    , type: "normal"
    , width: 979
    }
  */

    //lx.speak("Popup window created")
    this.tabId = window_data.tabs[0].id
    this.tabTracker.registerPopup(this.tabId)
  }

  Popup.prototype.tellNotebook = function tellNotebook(message) {
    chrome.tabs.sendMessage(this.tabId, message)
  }

  
})(lexogram)