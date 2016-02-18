"use strict"

;(function notebook(lx) {
  //lx.speak("notebook")

  lx.addConstructor(Notebook)

  function Notebook () {
    //lx.speak("initializing notebook")
  }

  /** Use a separate initialize() method so that all prototype
   *  methods have been attached to the new object.
   */
  
  
  Notebook.prototype.initialize = function initialize(dependencies) {
    var that = this
    var url = chrome.extension.getURL("html/lx-content.html")
    var width = 300
    var top = 0
    var rect = {
      left: screen.availWidth - width
    , top: top
    , width: width
    , height: screen.availHeight - top
    }
    var options = {
      url: url
  //, tabId
    , left: rect.left
    , top: rect.top
    , width: rect.width
    , height: rect.height
  //, focused: true
  //, incognito: false
    , type: "popup" //"normal"|"detached_panel"|"panel"//<experimental
  //, state: "normal" //"minimized"|"maximized"|"fullscreen"|"docked"
    }

    this.tabTracker = dependencies.tabTracker 
    this.tab_id = undefined // set in windowCreated()

    chrome.windows.create(options, function callback(window_data) {
      that.windowCreated.call(that, window_data)
    })
  }
  
  Notebook.prototype.windowCreated = function windowCreated(window_data) {
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

    //lx.speak("notebook window created")
    this.tab_id = window_data.tabs[0].id
    this.tabTracker.registerNotebook(this.tab_id)
  }

  Notebook.prototype.xx = function xx(tab_data) {
  }

  
})(lexogram)