/** BACKGROUND **
 * 
 */

var extension

;(function background(){
  "use strict"

  //var 
  extension = {
    //meteorURL: "http://localhost:3000/"
    meteorURL: "http://localhost/NoteBook/main.html"
    //meteorURL: "http://dev.lexogram.com/extension/main.html"
  // use your own local URL ^

  , icons: { // <HARD-CODED>
      inactive: "img/19/inactive.png"
    , ready: "img/19/ready.png"
    , active: "img/19/active.png"
    }

  , storedSettings: { 
      users: {}
    , nativeCode: "en"
    , targetCode: "fr"
    , target: { en: ["all"] } // TODO simplify
    , showTranslation: true
    , anchorId: "French"
    , autoActivate: []
    , noteBookRect: { width: 360, top: 0 }
    }
  , localStorageKey: "settings" 

  , ports: {}
  , googleTabId: 0
  , googleInitialized: false
  , nativeCode: "fr"
  , targetCode: "en"
  , selection: ""
  , activeTabs: []
  , activeTabId: 0  
  , autoActivate: [] // [ <url of auto-activated page>, ... ]
  , users: {}
  , target: {}
  , noteBookRect: {}
  , noteBookOptions: {}
  , noteBookId: 0

    // <HACK: Google translate uses custom code for Chinese> //
  , googleLUT: { zh: "zh-CN" }
  , languageLUT: {}  // { tabId: languageMap, ... }


  
  , initialize: function initialize() {
      this.readSettings()

      return this
    }

    /**
     * SOURCE: Sent by initialize and ensureNoteBookWindowIsOpen
     * ACTION: Loads settings from LocalStorage
     */
  , readSettings: function readSettings() {
      var settings = this.getFromLocalStorage(this.localStorageKey,{})
      var value
      var key

      for (key in this.storedSettings) {
        value = settings[key] || this.storedSettings[key]
        this[key] = this.storedSettings[key] = value
      }
    }

    /**
     * SOURCE: Called by initialize
     * ACTION: Retrieves a JSONifiable item from localStorage, or uses
     *         a default value if none is found
     * @param  {string} itemName  name of the item to retrieve from
     *                            localStorage
     * @param  {any}    fallback  value to use if there is no matching
     *                            item in localStorage 
     * @return {same as fallback} stored value or fallback
     */
  , getFromLocalStorage: function getFromStorage(itemName, fallback) {
      var item = localStorage.getItem(itemName)

      if (item) {
        try {
          item = JSON.parse(item)
        } catch(error) {}
      }

      if (item === null || typeof item !== typeof fallback) {
        item = fallback
      }

      return item
    }

  , saveToLocalStorage: function saveToLocalStorage(request) {
      this.storedSettings[request.key] = request.value
      var settings = JSON.stringify(this.storedSettings)
      localStorage.setItem(this.localStorageKey, settings)
    }

    /**
     * [setNoteBookOptions description]
     */
  , setNoteBookOptions: function setNoteBookOptions() {
      // TODO: Ensure that the notebook is completely on-screen if
      // the screen rect has changed. (Allow user to place it partly
      // off-screen, so long as screen rect doesn't change.)
      var width = this.noteBookRect.width
      var left = this.noteBookRect.left || screen.availWidth - width
      var top = this.noteBookRect.top
      var height = this.noteBookRect.height || screen.availHeight

      var noteBookOptions = {
        url: this.meteorURL
      , left: left
      , top: top
      , width: width
      , height: height
      , focused: true
      , type: "popup"
      }

      return noteBookOptions
    }

    /**
     * SOURCE: Received after the NoteBook calls 
     *         chrome.runtime.connect( ... ) in order to open a
     *         permanent port
     * ACTION: Set up connection with NoteBook's connection script
     */
  , openConnection: function openConnection(externalPort) {
      this.ports[externalPort.name] = externalPort
      externalPort.onMessage.addListener(treatMessage)

      if (this.googleTabId) {
        this.activateGooglePage(this.googleTabId)
      }
    }

    // treatMessage // treatMessage // treatMessage // treatMessage //
    
  , getStoredSettings: function getStoredSettings(request) {
      request.data = this.storedSettings
      this.ports.notebook.postMessage(request)
    }

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

    /**
     * SOURCE: Sent by the initialize method in content.js
     * ACTION: Checks if the extension was already activated by a
     *         an earlier page opened in this tab, or whether this
     *         page is set to open the extension automatically.
     *         Calls back with the response true | false | undefined
     */
  , disableExtension: function disableExtension() {
      this.ports.notebook.disconnect()
      delete this.ports.notebook

      var message = { method: "closeExtension" }
      var ii = this.activeTabs.length
      var tabId

      while (ii--) {
        tabId = this.activeTabs[ii]
        chrome.tabs.sendMessage(tabId, message)
        this.updateIcon(tabId)
      }

      this.activeTabs.length = 0
      this.activeTabId = 0
      this.noteBookId = 0
    }

    // COLOURATION // COLOURATION // COLOURATION // COLOURATION //

  , getFrequencyData: function getFrequencyData(request, sender) {
      // { method: "getFrequencyData"
      // , data: textContent }
      request.id = sender.tab.id

      ;(function postMessageWhenPortIsOpen(){
        if (extension.ports.notebook) {
          extension.ports.notebook.postMessage(request)
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

    // NATIVE AND TARGET LANGUAGES // NATIVE AND TARGET LANGUAGES //

  , setLanguages: function setLanguages(languageMap) { // NEW
      this.nativeCode = languageMap.nativeCode
      this.targetCode = languageMap.targetCode
      this.target = {}
      this.target[this.targetCode] = ["all"]
      this.saveToLocalStorage({
        key: "target"
      , value: this.target
      })

      for (var tabId in this.languageLUT) { // string
        tabId = parseInt(tabId, 10)
        this.updateIcon(tabId)
      }
      
      this.showInGoogleTab()
    }

    // INSTALLATION // INSTALLATION // INSTALLATION // INSTALLATION //

  , ensureNoteBookWindowIsOpen: function ensureNoteBookWindowIsOpen() {
      var noteBookOptions
     
      if (!this.noteBookId) {
        this.readSettings()

        noteBookOptions = this.setNoteBookOptions()
        chrome.windows.create(noteBookOptions, setNoteBookWindowId)
      }

      function setNoteBookWindowId(window) {
        extension.noteBookId = window.id
      }
    }

    // TRANSLATION // TRANSLATION // TRANSLATION // TRANSLATION //

    /** 
     * SOURCE: Received from chrome when a tab is updated or removed
     * ACTION: 
     * @param  {[type]} tabId             integer id of affected tab
     * @param  {object} changedInfo may be ...
     *            * { isWindowClosing: <boolean, windowId: <integer> }
     *              ... if call triggered by chrome.tabs.onRemoved
     *            * or one of ...
     *              { status: "loading", url: <url string> }
     *              { title: "Google Translate" }
     *              { status: "complete" }
     *              { favIconUrl: "https...favicon.ico" }
     *             ... if call triggered by chrome.tabs.onUpdate   
     * @param  {undefined|object} tab     used to check if tab closed
     */
  , tabChanged: function tabChanged(tabId, changedInfo, tab) {
      switch(tabId) {
        case this.googleTabId:
          treatGoogleTab()
        break

        default:
          if (!tab) {
            Tools.removeFromArray(this.activeTabs, tabId)
          }
      }
      
      function treatGoogleTab() {
        if (!tab) {
        // The Google Translate tab is closing
          extension.googleTabId = 0
          extension.googleInitialized = false

        } else if (!extension.googleInitialized) {
          // Required the first time a translation is requested
          if (changedInfo.status === "complete") {
            extension.activateGooglePage(tabId)
          }
        }
      }
    }

    /**
     * @param  {[type]} tabInfo { tabId: <integer>
     *                          , windowId: <integer>
     *                          }
     */
  , tabActivated: function tabActivated(tabInfo) {
      var tabId = tabInfo.tabId
      if (this.activeTabs.indexOf(tabId) > -1) {
        this.activeTabId = tabId
        this.updateIcon(tabId)
      }
    }

    /**
     * SOURCE: Sent by changeSelection and setLanguages
     * ACTION: Opens or updates a tab pointing at translate.google.com
     *         When the tab is ready, tells the content script in that
     *         tab to find the HTML element that contains the
     *         translation.
     */
  , showInGoogleTab: function showInGoogleTab() {
      var options = {}
      var lang

      if (!this.selection) {
        return
      }

      this.activateGooglePage(this.googleTabId)

      lang = this.selection.lang || this.targetCode
      // <HACK: Google translate uses custom code for Chinese
      if (this.googleLUT[lang]) {
        lang = this.googleLUT[lang]
      }
      // HACK> //

      options.url = "https://translate.google.com/#"
      options.url += lang + "/" + this.nativeCode + "/"
      options.url += encodeURIComponent(this.selection.text)

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

    /**
     * SOURCE: Sent by the tabOpened callback in showInGoogleTab 
     *         by openConnection and by tabChanged
     * ACTION: Tells the content script in the translate.google.com
     *         page to find the HTML element that contains the
     *         translation, and send its contents to the NoteBook
     *         window each time it changes.
     * NOTE:   Perhaps not all of these source calls are required, but
     *         the translation forwarding feature tends to fail
     *         unpredictably, so until the source of the failure is
     *         understood, it's best to make sure it is always ready
     *         just in time.
     * @param  {integer} tabId id of the google tab
     */
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

    /**
     * SOURCE: Sent by tellBackground in the translation.js script
     *         after a click on the goSource button
     * ACTION: Tells the google tab to show itself
     */
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

    // BROWSERACTION //BROWSERACTION //BROWSERACTION //BROWSERACTION 

    /**
     * SOURCE: Sent by activateExtension and state_changed, where the 
     *         call comes from the browserAction popup and the current
     *         tab needs to be determined.
     * ACTION: Calls chrome.tabs.query to get a pointer to the current
     *         tab, and then calls the method defined in <request>
     *         with the tab object followed by the given arguments.
     * @param  {object} request will be an object map with the format:
     *                          { method: <string method name>
     *                          , arguments: <array>
     *                          }
     */
  , asyncTreatTab: function asyncTreatTab(request) {
      var self = this
      var method = this[request.method]
      var args = request.arguments || []

      if (!(method instanceof Function)) {
        return
      }

      chrome.tabs.query(
        { active: true } //, currentWindow: true }// not while debugging
      , treatRequest
      )

      function treatRequest(tabs) {
        if (!tabs.length) {
          return
        }
        
        args.unshift(tabs[0])
        method.apply(self, args)       
      }
    }

    /**
     * SOURCE: Sent from the content script when a page is (re)loaded
     * ACTION: * Saves the languageData for the page so that it can be
     *           reused to reset the browserAction icon and badge if 
     *           the extension is deactivated
     *         * Sets the icon and badge to the inactive or ready
     *           state
     *         * Checks if this page's url is on the autoActivate
     *           list, and if so auto-activates the extension
     * @param  {object} request will be an object map with the format
     *                          { method: "shareLanguageData"
     *                          , data: { 
     *                              <langCode>: {
     *                                  <countryCode>: <integer>
     *                                , ...
     *                                , all: <integer>
     *                                }
     *                              , ...
     *                              }
     *                              , all: <integer>
     *                              }
     *                           }
     *                          The integer values represent the
     *                          number of characters attributed to
     *                          each language on the page.
     * @param  {[type]} sender  will be an object map with the format:
     *                          { ...
     *                          , tab: {
     *                              ...
     *                            , id: <integer sender tab id>
     *                            , ...
     *                            }
     *                          , url: <string url>
     *                          , ...
     *                          }
     */
  , pageOpened: function pageOpened(request, sender, sendResponse) {
      var tab = sender.tab
      var url = sender.url
      var tabId = this.activeTabId = tab.id
      var extensionIsActive = (this.activeTabs.indexOf(tabId) > -1)

      if (!extensionIsActive) {
        extensionIsActive = this.checkUrlForMatch(sender.url)
      }
 
      this.languageLUT[tabId] = request.languageData
      this.toggleExtension(tab, extensionIsActive)

      sendResponse({ extensionIsActive: extensionIsActive })
    }

    /**
     * @param  {Port} externalPort
     * @return {[type]}
     */
  , popupOpened: function popupOpened(externalPort) {
      externalPort.onDisconnect.addListener(function () {
        var id
        if (id = extension.noteBookId) {
          chrome.windows.update(id, { focused: true })
        }
      })
    }

    /**
     * SOURCE: Sent by:
     *         * pageOpened, in which case state may be either true or
     *           false depending on whether the extension is already
     *           active in this tab, or whether this page is set to
     *           auto-activate
     *         and (via asyncTreatTab):
     *         * activateExtension, when the popup window is opened,
     *           in which case state is true and response is a
     *           callback function
     *         * state_changed, when the activate checkbox in the
     *           popup window is toggled, in which case state may be
     *           either true or false
     * @param  {object} tab      { ...
     *                           , tab: { ..., id: <integer>, ... }
     *                           , url: <string>
     *                           , ...
     *                           }
     * @param  {boolean} active  true if extension should be active
     *                           for this tab
     * @param  {[type]} response asynch callback function if call came
     *                           from activateExtension when popup is
     *                           opened.
     */
  , toggleExtension: function toggleExtension(tab, active, response) {
      var tabId = tab.id
      var url
        , autoActivate
        , colorize
        , message

      if (response instanceof Function) {
        // The activation call came from opening the popup window.
        // browserAction badge text is already set
        url = tab.url

        autoActivate = this.autoActivate.indexOf(url) > -1
        colorize = false // TODO

        response({
          autoActivate: autoActivate
        , colorize: colorize
       })

      } else {
        this.updateIcon(tabId) // sets badge; icon "inactive"|"ready"
      }

      if (active) {
        Tools.addToArray(this.activeTabs, tabId)
        this.ensureNoteBookWindowIsOpen()
        this.setIcon(tabId, "active") // resets icon to "active"

        var message = {
            method: "setExtensionStatus"
          , extensionIsActive: true
          }

      } else {
        Tools.removeFromArray(this.activeTabs, tabId)
        var message = { method: "closeExtension" }
      }

      chrome.tabs.sendMessage(tabId, message)
    }

    /**
     * SOURCE: Called from state_changed via asyncTreatTab
     * ACTION: Adds or removes tab.url from the array of urls that
     *         trigger auto-activation. Saves the changed array to
     *         localStorage
     * @param {object}   tab      active tab object
     * @param {function} response calback for popup.js
     */
  , toggleAutoActivate: function toggleAutoActivate(tab, state) {
      if (state) {
        Tools.addToArray(this.autoActivate, tab.url)
      } else {
        Tools.removeFromArray(this.autoActivate, tab.url)
      }

      this.saveToLocalStorage({
        key: "autoActivate"
      , value: this.autoActivate
      })
    }

    /** 
     * SOURCE: Sent by pageOpened and toggleExtension
     * ACTION: Determines if any of the languages the user is learning
     *         is present on the page, and if so:
     *         * highlights the browserAction icon
     *         * shows a badge with the ISO code for the dominant
     *           target language
     *         * shows the badge in a shade ranging from black (all
     *           in the target language) to pale grey (small
     *           percentage of the target language)
     * TODO:   When the database is online, the badge colour can range
     *         from black (all words familiar) to red (high proportion
     *         of unfamiliar words)
     */
  , updateIcon: function updateIcon(tabId) {
      var pageLanguages = this.languageLUT[tabId]
      var languageMatch = findLanguageMatch(this.target)
      var ratio
        , byte
        , colorArray

      if (languageMatch) {
        ratio = pageLanguages[languageMatch].all / pageLanguages.all
        byte = 208 - Math.round(208 * ratio)
        colorArray = [byte, byte, byte, 255] // always opaque
        
        this.setIcon(tabId, "ready")

        chrome.browserAction.setBadgeBackgroundColor({
          tabId: tabId
        , color: colorArray
        })
        chrome.browserAction.setBadgeText({
          tabId: tabId
        , text: languageMatch
        })

      } else {
        this.setIcon(tabId, "inactive")
        chrome.browserAction.setBadgeText({
          tabId: tabId
        , text: ""
        })
      }

      /**
       * @param  {object} languagesOfInterest will be an object map:
       *                             { <langCode>: {
       *                                  <countryCode>: <integer>
       *                                , ...
       *                                , all: <integer>
       *                                }
       *                              , ...
       *                              }
       *                              , all: <integer>
       *                            }
       * @return {string}           "" or a 2-letter ISO language code
       */
      function findLanguageMatch(languagesOfInterest) {
        var match = []
        var countriesOfInterest
          , pageCountries
          , country

        for (var language in languagesOfInterest) {
          countriesOfInterest = languagesOfInterest[language]

          if (countriesOfInterest) { 
            pageCountries = pageLanguages[language]

            if (pageCountries) {
              pageCountries = Object.keys(pageCountries)
              
              pageCountries = pageCountries.filter(function(country) {
                country = country.toLowerCase()
                return countriesOfInterest.indexOf(country) > -1
              })

              // INCLUDE all?
              if (pageCountries.length) {
                match.push({ 
                  language: language
                , count: pageLanguages[language].all
                })
              }
            }
          }          
        }

        match.sort(function (a, b) {
          // Order descending by count
          return b.count - a.count
        })

        return match[0] ? match[0].language : ""
      }
    }

    /**
     * SOURCE: Sent by updateIcon and toggleExtension
     * @param {object}  tabId  id of tab to which this icon applies
     * @param {string}  state  "inactive"|"ready"|"active"
     */
  , setIcon: function setIcon(tabId, state) {
      var message = {
          tabId: tabId
        , path: this.icons[state]
        }

      chrome.browserAction.setIcon(message)
    }
   
    /**
     * SOURCE: Called immediately when the popup window opens
     * @param  {object} request    { method: ""activateExtension }
     * @param  {object} sender     { id: <32-char string>
     *                             , url: "chrome-extension://<id>/
     *                                                   popup.html"
     *                             }
     * @param  {function} response Uses asyncTreatTab to get the tab
     *                             object for the current page, then
     *                             activates the extension for this
     *                             tab
     */
  , activateExtension: function activate(request, sender, response) {
      this.asyncTreatTab({
        method: "toggleExtension"
      , arguments: [true, response]
      }) 
    }

    /**
     * SOURCE: Sent from the popup window each time an input button
     *         is clicked
     * ACTION: Depends on the value of <key>
     * @param  {object} request { method: "state_changed"
     *                          , key: <"active" | "always" | ...>
     *                          , value: <boolean checked>
     *                          }
     */
  , state_changed: function state_changed(request) {
      var key = request.key
      var value = request.value

      switch (key) {
        case "active":
          this.asyncTreatTab({
            method: "toggleExtension"
          , arguments: [value]
          })
        break

        case "always":          
          this.asyncTreatTab({
            method: "toggleAutoActivate"
          , arguments: [value]
          })
        break
        // case "page":

        // break
        // case "site":

        // break

        // case "colourize":

        // break
        // case "frequency":

        // break
        // case "familiarity":

        // break
      }
    }

  , unloadPopUp: function unloadPopup() {
      console.log("unloadPopup", [].slice.call(arguments))
    }

    // PLACEHOLDER // PLACEHOLDER // PLACEHOLDER // PLACEHOLDER //
  
  , checkUrlForMatch: function checkUrlForMatch(url) {
      return this.autoActivate.indexOf(url) > -1
    }
 
  , forward: function forward(request, sender, sendResponse) {
      // iFrameSetWidth, showTranslation
      if (this.ports.notebook) {
        this.ports.notebook.postMessage(request, sender, sendResponse)
      }
    }
  }.initialize()

  // LISTENERS // LISTENERS // LISTENERS // LISTENERS // LISTENERS // 

  function openConnection(externalPort) {
    extension.openConnection.call(extension, externalPort)
  }

  function tabChanged(tabId, changedInfo, tab) { // NEW
    extension.tabChanged.call(extension, tabId, changedInfo, tab)
  }

  function tabActivated(tabInfo) { // NEW
    extension.tabActivated.call(extension, tabInfo)
  }

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method || request.name]
    if (typeof method === "function") {
      method.call(extension, request, sender, sendResponse)
    } else {
      extension.forward.call(extension, request, sender, sendResponse)
    }

    if (request.async) {
      return true
    }
  }
  
  chrome.runtime.onConnectExternal.addListener(openConnection)
  chrome.runtime.onConnect.addListener(treatMessage)
  chrome.runtime.onMessage.addListener(treatMessage)
  chrome.tabs.onRemoved.addListener(tabChanged)
  chrome.tabs.onUpdated.addListener(tabChanged)
  //chrome.tabs.onActivated.addListener(tabActivated)
})()

