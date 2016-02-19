"use strict"

;(function tab_tracker(lx) {
  //lx.speak("tab tracker")

  lx.addConstructor(TabTracker)

  var that

  function TabTracker () {
    that = this
  }

  /** Use a separate initialize() method so that all prototype
   *  methods have been attached to the new object.
   */
  TabTracker.prototype.initialize = function initialize(dependencies) {
    //lx.speak("initializing tab tracker")
 
    this.popup       = dependencies.popup
    this.open_tabs   = []
    this.url_map     = {}
    this.active_tab  = undefined // set in tabActivated()
    this.popup_id    = undefined // set in registerPopup
 
    chrome.tabs.onCreated.addListener(function (tab_data) {
      that.tabCreated.call(that, tab_data)
    })

    chrome.tabs.onActivated.addListener(function (tab_data) {        that.tabActivated.call(that, tab_data)
    })

    chrome.tabs.onUpdated.addListener(function (tabId, tab_info, tab_data) {
      that.tabUpdated.call(that, tabId, tab_info, tab_data)
    })

    chrome.tabs.onRemoved.addListener(function (tabId, window_data) {
      that.tabRemoved.call(that, tabId, window_data)
    })

    // Get all open tabs, and for each inform the tabTracker of its
    // id and url
    chrome.tabs.query({}, initializeTabs)

    function initializeTabs(tabs) {
       var tab
         , tabId
           
      for (var ii in tabs) {
        tab = tabs[ii]
        tabId = tab.id
        that.open_tabs.unshift(tabId)
        that.url_map[tabId] = tab.url

        if (tab.active) {
          that.active_tab = tabId
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
    var tabId = tab_data.id

    if ( tabId === this.popup_id ) {
      return // ignore the popup tab
    } else if ( this.open_tabs.indexOf(tabId) < 0 ) {
      this.open_tabs.unshift(tabId)
    } else {
      lx.speak("tab created with duplicate id: " + tabId)
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
   
    var tabId = tab_data.tabId
    var index = this.open_tabs.indexOf(tabId) 

    if (!this.popup_id || tabId === this.popup_id ) {
      return // ignore the popup tab, which may not have registerd yet
    } else if (index < 0) {
      lx.speak("tab activated with unknown ID: " + tabId)
      console.log(tab_data)
      console.log(this.open_tabs)
    } else {
      // Shift tabId to the start of this.open_tabs, so that they are 
      // stored with the most recent first.
      this.open_tabs.splice(index, 1)
      this.open_tabs.unshift(tabId)
      this.active_tab = tabId
    }

    //console.log("tabActivated", tabId, this.open_tabs)

    var message = "getFullText"
    var options = {
      frameId: 0 // main document only, not any iFrames
    }

// lx.speak("send getFullText to active tab " + this.active_tab)
// chrome.tabs.get(
//   this.active_tab
// , function (tab) {
//     console.log("url for active tab: ",tab.url);
// })

    chrome.tabs.sendMessage(
      this.active_tab
    , message
    , options
    , sendFullTextToNotebook
    )
  }

  TabTracker.prototype.tabUpdated = function tabUpdated(
    tabId, tab_info, tab_data) {
    // tabId = <integer>
    // tab_info = { favIconUrl: <url> } // should be ignored
    // or {
    //   status: "loading"
    // , url: "..."
    // }
    // or { status: "complete" }
    // tab_data = <as tabCreated>

    if ( tabId === this.popup_id ) {
      return // ignore the popup tab
    } else if (tab_info.status === "loading") {
      this.url_map[tabId] = tab_info.url
      if ( this.open_tabs.indexOf(tab_data.id) < 0 ) {
        this.open_tabs.unshift(tab_data.id)
      }
    }

    //console.log("tabUpdated", tabId, tab_info, this.url_map)
  }

  TabTracker.prototype.tabRemoved = function tabRemoved(
    tabId, window_data) {
    // tabId = <integer>
    // window_data = {
    //   isWindowClosing: <boolean>
    // , windowId: <integer>
    // }
      
    if ( tabId === this.popup_id ) {
      return this.popupClosed()
    }

    var index = this.open_tabs.indexOf(tabId)
    if (index < 0) {
      // The contents of this tab are not being tracked
      return
    }

    this.open_tabs.splice(index, 1)

    if (this.active_tab === tabId) {
      // Special case:
      // The tab whose text is currently on display is closing
      if (this.open_tabs.length) {
        // The most recently active tab will be restored
      } else {
        // The notebook is on its own, with no feeder pages
      }
    }

    // Clean up connection with Meteor
    //console.log("tabRemoved", tabId, this.open_tabs, this.active_tab)
  }

  TabTracker.prototype.registerPopup = function register(tabId) {
    this.popup_id = tabId
    var index = this.open_tabs.indexOf(tabId)
    if (index > -1) {
      this.open_tabs.splice(index, 1)
    }

    if (tabId === this.active_tab) {
      // Choose the most recently created
      tabId = this.open_tabs[0]
    } else {
      tabId = this.active_tab
    }

    // Now that the popup window's id is known, we can activate the
    // topmost tab
    this.tabActivated( { tabId: tabId })
  }

  function defaultCallback(response) {
    console.log(response)
  }

  function sendFullTextToNotebook(response) {
    // { data: <full text string> }
    if (!response) {
      // lx_context.js is not attached to the active page. This is
      // probably a page like chrome://extensions/, during debugging
      // lx.speak("no text to send to notebook. stopping")
      return
    }

    // lx.speak("sendFullTextToNotebook")
    console.log(response)

    response.method = "showFullText"
    that.popup.tellNotebook( response )
  }
})(lexogram)