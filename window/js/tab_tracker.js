"use strict"

;(function tab_tracker(lx) {
  //lx.speak("tab tracker")

  lx.addConstructor(TabTracker)

  function TabTracker () {}

  /** Use a separate initialize() method so that all prototype
   *  methods have been attached to the new object.
   */
  TabTracker.prototype.initialize = function initialize(dependencies) {
    //lx.speak("initializing tab tracker")
    var that = this

    this.manager     = dependencies.manager
    this.open_tabs   = []
    this.url_map     = {}
    this.active_tab  = undefined // set in tabActivated()
    this.notebook_id = undefined // set in registerNotebook
 
    chrome.tabs.onCreated.addListener(function (tab_data) {
      that.tabCreated.call(that, tab_data)
    })

    chrome.tabs.onActivated.addListener(function (tab_data) {        that.tabActivated.call(that, tab_data)
    })

    chrome.tabs.onUpdated.addListener(function (tab_id, tab_info, tab_data) {
      that.tabUpdated.call(that, tab_id, tab_info, tab_data)
    })

    chrome.tabs.onRemoved.addListener(function (tab_id, window_data) {
      that.tabRemoved.call(that, tab_id, window_data)
    })

    // Get all open tabs, and for each inform the tabTracker of its
    // id and url
    chrome.tabs.query({}, initializeTabs)

    function initializeTabs(tabs) {
       var tab
         , tab_id
           
      for (var ii in tabs) {
        tab = tabs[ii]
        tab_id = tab.id
        that.open_tabs.unshift(tab_id)
        that.url_map[tab_id] = tab.url

        if (tab.active) {
          that.active_tab = tab_id
        }
      }

      that.tabActivated( { tabId: that.active_tab })

      //console.log("initialized:", that.active_tab, that.open_tabs, that.url_map)
    }
  }

  TabTracker.prototype.tabCreated = function tabCreated(tab_data) {
  /*
    tab_data = {
      active: false
    , audible: false
    , height: 0
    , highlighted: false
    , id: 25
    , incognito: false
    , index: 0
    , muted: false
    , mutedCause: ""
    , pinned: false
    , selected: true
    , status: "loading"
    , title: ""
    , url: "..."
    , width: 0
    , windowId: 24
    }
  */
    var tab_id = tab_data.id

    if ( tab_id === this.notebook_id ) {
      return // ignore the notebook tab
    } else if ( this.open_tabs.indexOf(tab_id) < 0 ) {
      this.open_tabs.unshift(tab_id)
    } else {
      lx.speak("tab created with duplicate id: " + tab_id)
      console.log(this.open_tabs)
    }

    //console.log("tabCreated", tab_data, this.open_tabs)
  }

  TabTracker.prototype.tabActivated = function tabActivated(tab_data) {
    /* 
      tab_data = {
         tabId: 28
       , windowId: 27
       }
    */ 
    // Fires when the active tab in a window changes. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events to be notified when a URL is set.
   
    var tab_id = tab_data.tabId
    var index = this.open_tabs.indexOf(tab_id) 

    if ( tab_id === this.notebook_id ) {
      return // ignore the notebook tab
    } else if (index < 0) {
      lx.speak("tab activated with unknown ID: " + tab_id)
      console.log(tab_data)
      console.log(this.open_tabs)
    } else {
      // Shift tab_id to the end of this.open_tabs, so that they are 
      // stored with the most recent first.
      this.open_tabs.splice(index, 1)
      this.open_tabs.unshift(tab_id)
      this.active_tab = tab_id
    }

    //console.log("tabActivated", tab_id, this.open_tabs)

    var message = {
      method: "connect"
    }
    var options = {
      frameId: 0 // main document only, not any iFrames
    }
    chrome.tabs.sendMessage(
      this.active_tab
    , "connect"
    , options
    , defaultCallback
    )
  }

  TabTracker.prototype.tabUpdated = function tabUpdated(
    tab_id, tab_info, tab_data) {
    // tab_id = <integer>
    // tab_info = { favIconUrl: <url> } // should be ignored
    // or {
    //   status: "loading"
    // , url: "..."
    // }
    // or { status: "complete" }
    // tab_data = <as tabCreated>

    if ( tab_id === this.notebook_id ) {
      return // ignore the notebook tab
    } else if (tab_info.status === "loading") {
      this.url_map[tab_id] = tab_info.url
      if ( this.open_tabs.indexOf(tab_data.id) < 0 ) {
        this.open_tabs.unshift(tab_data.id)
      }
    }

    //console.log("tabUpdated", tab_id, tab_info, this.url_map)
  }

  TabTracker.prototype.tabRemoved = function tabRemoved(
    tab_id, window_data) {
    // tab_id = <integer>
    // window_data = {
    //   isWindowClosing: <boolean>
    // , windowId: <integer>
    // }
      
    if ( tab_id === this.notebook_id ) {
      return this.notebookClosed()
    }

    var index = this.open_tabs.indexOf(tab_id)
    if (index < 0) {
      // The contents of this tab are not being tracked
      return
    }

    this.open_tabs.splice(index, 1)

    if (this.active_tab === tab_id) {
      // Special case:
      // The tab whose text is currently on display is closing
      if (this.open_tabs.length) {
        // The most recently active tab will be restored
      } else {
        // The notebook is on its own, with no feeder pages
      }
    }

    // Clean up connection with Meteor
    //console.log("tabRemoved", tab_id, this.open_tabs, this.active_tab)
  }

  TabTracker.prototype.registerNotebook = function register(tab_id) {
    this.notebook_id = tab_id
  }

  function defaultCallback(response) {
    console.log(response)
  }
})(lexogram)