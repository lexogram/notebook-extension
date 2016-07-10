"use strict"

/**
 * The TabTracker object is instantiated by background.js when the
 * browser is launched or extension is reloaded
 * 
 * It receives notification from chrome each time a tab is created,
 * activated, updated or removed. It also receives a message directly
 * from the Popup object when the Popup window has been opened, to
 * register the tabId of the Popup window.
 *
 * The url for windows for chrome://extension, the debugger, the
 * Popup and any new (empty) tabs begin with "chrome://" or
 * "chrome-extension://", and can be ignored.
 *
 * When a new tab opens, the events tabCreated, tabActivated, 
 * tabUpdated (status = "loading")+, tabUpdated (status = "complete")
 * are called in this order. If a tab is already open when the
 * Notebook is opened, all of this will already have occurred, and
 * tabActivated { tabId: *, windowId: * } may be triggered on its own,
 * without giving a direct indication of the tab's URL.
 */

;(function tab_tracker(lx) {
  //lx.speak("tab tracker")

  lx.addConstructor(TabTracker)

  var that

  function TabTracker () {
    that = this
  }

  /** Use a separate initialize() method so that all prototype
   *  methods have been attached to the new object before this is
   *  called
   *  SOURCE: Sent by the useExtension() method in the background.js
   *          script, when all scripts have been loaded.
   */
  TabTracker.prototype.initialize = function initialize(dependencies) {
    //lx.speak("initializing tab tracker")
 
    this.popup       = dependencies.popup
    this.open_tabs   = []
    this.url_map     = {}
    this.active_tab  = undefined // set in tabActivated()
    //this.popup_id    = undefined // set in registerPopup
 
    chrome.tabs.onCreated.addListener(function (tabData) {
      that.tabCreated.call(that, tabData)
    })

    chrome.tabs.onActivated.addListener(function (tabData) {        that.tabActivated.call(that, tabData)
    })

    chrome.tabs.onUpdated.addListener(function (tabId, tabInfo, tabData) {
      that.tabUpdated.call(that, tabId, tabInfo, tabData)
    })

    chrome.tabs.onRemoved.addListener(function (tabId, window_data) {
      that.tabRemoved.call(that, tabId, window_data)
    })

    // Get all open tabs, whether they are chrome tabs or not, and
    // for each inform the tabTracker of its id and url
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
          console.log("active:", tabId)
          that.active_tab = tabId
        }
      }

      //console.log("initialized:", that.active_tab, that.open_tabs, that.url_map)
    }
  }

  TabTracker.prototype.tabCreated = function tabCreated(tabData) {
  /*
    tabData = {
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
    // announceEvent("created", tabData)
    // var tabId = tabData.id

    // if ( tabId === this.popup_id ) {
    //   return // ignore the popup tab
    // } else if ( this.open_tabs.indexOf(tabId) < 0 ) {
    //   this.open_tabs.unshift(tabId)
    // } else {
    //   lx.speak("tab created with duplicate id: " + tabId)
    //   console.log(this.open_tabs)
    // }

    //console.log("tabCreated", tabData, this.open_tabs)
  }

  /** Fires when the active tab in a window changes. Note that the
   * tab's URL may not be set at the time this event fired, but you  * can listen to onUpdated events to be notified when a URL is set.
   */
  TabTracker.prototype.tabActivated = function tabActivated(tabData) {
    /* 
    tabData = {
       tabId: 28
     , windowId: 27
     }
    */ 
    announceEvent("activated", tabData)

    var tabId = tabData.tabId
    var index = this.open_tabs.indexOf(tabId)

    if (tabUrlStartsWithChrome(tabData)) {
      return // ignore settings, popup, debugger windows and new tabs
    }

    if (index < 0) {
      // <DEVELOPMENT>
      // The Popup window is not in open_tabs
      if (tabId !== this.popup_id) {
        lx.speak("Tab activated with unknown ID: " + tabId)
        console.log(tabData)
        if (window.getTabData) {
          getTabData(tabId)
        }
      }
      // </DEVELOPMENT>

      return
    }

    // Move this tab to the beginning
    this.open_tabs.splice(index, 1)
    this.open_tabs.unshift(tabId)
    this.active_tab = tabId    

    this.updateNotebook(tabId)
    console.log("tabActivated", tabId, this.open_tabs)
  } 

  /**
   * Called when the url of a page changes or when the page is
   * refreshed
   */
  TabTracker.prototype.tabUpdated = function tabUpdated(
    tabId, tabInfo, tabData) {
    // tabId   = <integer>
    // tabInfo = { favIconUrl: <url> } // should be ignored
    // or {
    //   status: "loading"
    // , url: "..."
    // }
    // or { status: "complete" }
    // tabData = <as tabCreated>
    announceEvent("updated", tabData)

    if (tabUrlStartsWithChrome(tabData)) {
      return // ignore the popup tab
    }

    if (tabInfo.status === "complete" && that.active_tab === tabId) {
      that.updateNotebook()
    }
    //console.log("tabUpdated", tabId, tabInfo, this.url_map)
  }

  /**
   * @source Registered to be called by chrome.tabs.onRemoved
   * @param  {integer} tabId      integer
   * @param  {object} window_data { isWindowClosing: <boolean>
   *                              , windowId: <integer>
   *                              }
   * @action Cleans up after a tab is closed.
   */
  TabTracker.prototype.tabRemoved = function tabRemoved(
    tabId, window_data) {

    announceEvent("removed", { tabId: tabId })

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

  /**
   * @source: sent by the windowCreated() method of popup.js after the
   *          PopUp window opens. 
   * @param: {integer} tabId – the id of the PopUp window
   * @action: Sets this.popup_id and removes the popup_id from the
   *          ids stored in open_tabs.
   *          Calls tabActivated() on the frontmost tab.
   */
  TabTracker.prototype.registerPopup = function register(tabId) {
    this.popup_id = tabId

    lx.speak("popup registered: " + tabId)
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
    // topmost tab. This may be a chrome tab, with no content script.
    this.tabActivated( { tabId: tabId })
  }

  /**
   * @source: Sent by tabActivated() and tabUpdated()
   * @action: Calls getFullText() in lx_content.js, which populates
   *          options with { data: <full text of main frame on page }
   *          and then sends the result in a callback to
   *          sendFullTextToNotebook()
   * @return {[type]} [description]
   */
  TabTracker.prototype.updateNotebook = function updateNotebook() {
    var message = "getFullText"
    var options = {
      frameId: 0 // main document only, not any iFrames
    }

    chrome.tabs.sendMessage(
      this.active_tab
    , message
    , options
    , sendFullTextToNotebook
    )
  }


  /** updateNotebook() above makes a call to chrome.tabs.sendMessage()
   *  which triggers this method as a callback.
   */
  function sendFullTextToNotebook(response) {
    // { data: <full text string> }
    if (!response) {
      // lx_context.js is not attached to the active page. This is
      // probably a page like chrome://extensions/, during debugging
      // lx.speak("no text to send to notebook. stopping")
      return
    }

    // lx.speak("sendFullTextToNotebook")
    // console.log(response)

    response.method = "showFullText"
    that.popup.tellNotebook( response )
  }

  /**
   * Called by tabActivated() and tabUpdated()
   * For tabActivated, a URL may already be recorded in url_map for
   * the given tabId. For tabUpdated, a new URL may be provided.
   * @param  {object} tabData has format
   *                   { tabId: <integer>
   *                   , windowId: <integer> } // tabActivated
   *                   OR
   *                   { id: <integer>
   *                   , ...
   *                   , url: <string>
   *                   , windowId: <integer> } // tabUpdated
   * @return {boolean} true if the tab associated with tabData is
   *                   - the "chrome://extensions/" developer tab
   *                   - the debugger window
   *                   - the Popup window
   *                   - a new tab with no content
   */
  function tabUrlStartsWithChrome(tabData) {
    var tabId = tabData.tabId || tabData.id
    var url = tabData.url

    if (url) {
      // Update the url_map with the new URL
      lx.speak("editing url_map: " + url)     
      console.log(that.url_map.toString())
      that.url_map[tabId] = url
      console.log(that.url_map)
      console.log("done")
    } else {
      url = that.url_map[tabId] || ""
    }

    var isChrome = (url).substr(0, 6) === "chrome"

    lx.speak("tab starts with chrome: " + isChrome)

    return isChrome
  }

  /**
   * @source: Sent by tabActivated(), tabUpdated(), tabCreated() and 
   *          tabRemoved()
   * @param  {string} eventName [description]
   * @param  {object} tabData   [description]
   * @action 
   */
  function announceEvent(eventName, tabData) {
    var url = tabData.url
              ? tabData.url
              : tabData.tabId
                ? "" + tabData.tabId
                : "" + tabData.id
    var index = url.length - 1

    // Simplify url to just the page name. Trim trailing "/"
    if (url.charAt(index) === "/") {
      url = url.substring(0, index)
    }

    url = url.substring(url.lastIndexOf("/") + 1)
    // Trim everything after ? or # in page name
    while (index = url.indexOf("?")
        || url.indexOf("#")
         , index > -1) {
      url = url.substring(0, index)
    }

    lx.speak(eventName + " " + url)
    console.log(tabData)
  }
})(lexogram)