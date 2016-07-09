"use strict"

;(function openWindow(lx) {
  //lx.speak("openWindow")

  lx.addConstructor(OpenWindow)

  var that
  var URL = chrome.extension.getURL("html/lxo_window.html")

  function OpenWindow () {
    //lx.speak("initializing popup")
    that = this
    this.tabId = undefined // set in windowCreated()
  }

  /** Use a separate initialize() method so that all prototype
   *  methods will have been attached to the new object by the time
   *  this method is called.
   *  
   *  @source Called by useExtension() in background.js, which itself
   *          is triggered when the browser is launched or the
   *          extension is reloaded.
   *  @param {object} dependencies { tabTracker: TabTracker
   *                               , popup: OpenWindow}
   */
  OpenWindow.prototype.initialize = function initialize(dependencies) {
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
    , type: "popup"//"normal"|"detached_panel"|"panel"//<experimental
  //, state: "normal" //"minimized"|"maximized"|"fullscreen"|"docked"
    }

    // this.tabTracker = dependencies.tabTracker 
    //this.tabId = undefined // set in windowCreated()

    chrome.windows.create(options, function callback(window_data) {
      that.windowCreated.call(that, window_data)
    })
  }
  
  /**
   * SOURCE: Called by the callback() function created above in
   *         initialize() after chrome.windows.created() has
   *         completed.
   * @param  {[type]} window_data [description]
   * @return {[type]}             [description]
   */
  OpenWindow.prototype.windowCreated = function windowCreated(window_data) {
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

    //lx.speak("Window created")
    this.tabId = window_data.tabs[0].id
    //this.tabTracker.registerPopup(this.tabId)
  }

  /**
   * SOURCE: Sent by the sendFullTextToNotebook() in tab_tracker.js
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  OpenWindow.prototype.tellNotebook = function tellNotebook(message) {
    chrome.tabs.sendMessage(this.tabId, message)
  }

  
})(lexogram)