/** BACKGROUND **
 * 
 */


;(function background(){
  "use strict"

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
  , activeTabs: []

  , languages: { // <HARD-CODED for testing>
      "en": ["all"]
    , "ru": ["all"]
    }

  , icons: { // <HARD-CODED>
      inactive: "img/19/inactive.png"
    , ready: "img/19/ready.png"
    , active: "img/19/active.png"
    }

  , languageLUT: {}  // { tabId: languageMap, ... }
  , autoActivate: [] // [ <url of auto-activated page>, ... ]
  
    /** Import injectedHTML for use in content pages */
  , initialize: function initialize() {
      var xhr = new XMLHttpRequest()
      xhr.open("GET", this.injectedHTML, true)
      xhr.onreadystatechange = stateChanged
      xhr.send()

      this.autoActivate = this.getFromLocalStorage("autoActivate", [])

      return this

      function stateChanged() {
        if (xhr.readyState === 4) {
          extension.injectedHTML = xhr.responseText
        }
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
  
    /** Called when browserAction button is clicked */
 
  // , useExtension: function useExtension() {
  //     this.ensureNoteBookWindowIsOpen()

  //     // Toolbar is not currently needed, but it might be useful in
  //     // the future to add it for unregistered users
  //     chrome.tabs.query(
  //       { active: true
  //       , currentWindow: true
  //       }
  //     , function (tabs) {
  //         extension.showToolbarIfRequired.call(extension, tabs)
  //       }
  //     )
  //   }

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

    /**
     * SOURCE: Sent by the initialize method in content.js
     * ACTION: Checks if the extension was already activated by a
     *         an earlier page opened in this tab, or whether this
     *         page is set to open the extension automatically.
     *         Calls back with the response true | false | undefined
     */
  , getExtensionStatus: function getExtensionStatus(request, sender, sendResponse) {
      var id = sender.tab.id
      // var extensionIsActive = this.tabMap[id]
      var extensionIsActive = (this.activeTabs.indexOf(id) > -1)

      if (!extensionIsActive) {
        extensionIsActive = this.checkUrlForMatch(sender.url)
      }

      if (extensionIsActive) {
        this.ensureNoteBookWindowIsOpen()
        // this.insertCSS(id)
        // this.insertToolbar(id)
        // this.tabMap[id] = true
        Tools.addToArray(this.activeTabs, id)
        // if added by checkUrlForMatch()
      } else {
        // ensure that tabMap[id] is undefined for when 
        // showToolbarIfRequired() is called next     
        // delete this.tabMap[id]
        Tools.deleteFromArray(this.activeTabs, id)
      }

      sendResponse({ extensionIsActive: extensionIsActive })
    }

    /**
     * SOURCE: Called by removeToolbar in content.js
     * ACTION: Sets tabMap(tabId) to false to indicate that the
     *         toolbar was open but is not open any more
     * @param  {[type]} request [description]
     * @param  {[type]} sender  [description]
     * @return {[type]}         [description]
     */
  , forgetExtension: function forgetExtension(request, sender) {
      // this.tabMap[sender.tab.id] = false
      Tools.deleteFromArray(this.activeTabs, sender.tab.id)
    }

  , disableExtension: function disableExtension() {
      this.ports.notebook.disconnect()
      delete this.ports.notebook

      var message = { method: "closeExtension" }
      var ii = this.activeTabs.length

      while (ii--) {
        chrome.tabs.sendMessage(this.activeTabs[ii], message)
      }
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
      
      this.showInGoogleTab()
    }

    // INSTALLATION // INSTALLATION // INSTALLATION // INSTALLATION //

  , ensureNoteBookWindowIsOpen: function ensureNoteBookWindowIsOpen() {
      if (this.ports.notebook) {
        return
      }

      var width = 360
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

  //  , showToolbarIfRequired: function showToolbarIfRequired(tabs) {
  //     var id = tabs[0].id
  //     var extensionIsActive = this.tabMap[id] // true|false|

  //     switch (extensionIsActive) {
  //       default: // undefined
  //         this.insertCSS(id)
  //         // fall throught to injectToolbar()
  //       case false:
  //         this.insertToolbar(id)
  //         this.tabMap[id] = true
  //         // no need to break: nothing else happens
  //       case true:
  //         // do nothing: the Toolbar is already active
  //     }
  //   }

  // , insertCSS: function insertCSS(id) {  
  //     var cssDetails = {
  //       file: this.injectedCSSFile
  //     , runAt: "document_start"
  //     }
  //     chrome.tabs.insertCSS(id, cssDetails)
  //   }

  // , insertToolbar: function insertToolbar(id) {
  //     var message = { 
  //       method: "insertToolbar"
  //     , html: this.injectedHTML
  //     }

  //     chrome.tabs.sendMessage(id, message)
  //   }

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
  , tabChanged: function tabChanged(tabId, changedInfo, tab) { // NEW
      if (tabId === this.googleTabId) {
        if (!tab) {
        // The Google Translate tab is closing
          this.googleTabId = 0
          this.googleInitialized = false

        } else if (!this.googleInitialized) {
          // Required the first time a translation is requested
          if (changedInfo.status === "complete") {
            extension.activateGooglePage(tabId)
          }
        }
      }
    }

    /**
     * SOURCE: Sent by changeSelection and setLanguages
     * ACTION: Opens or updates a tab pointing at translate.google.com
     *         When the tab is ready, tells the content script in that
     *         tab to find the HTML element that contains the
     *         translation.
     */
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
        { active: true, currentWindow: true }
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
  , shareLanguageData: function shareLanguageData(request, sender) {
      var tab = sender.tab
      var url = sender.url

      this.languageLUT[tab.id] = request.data
      this.updateIcon(tab)

      if (this.autoActivate.indexOf(url) > -1) {     
        this.addToActiveTabs(tab)
      }
    }

    /** 
     * SOURCE: Sent by shareLanguageData and setIcon if the extension
     *         is being deactivated
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
  , updateIcon: function updateIcon(tab) {
      var pageLanguages = this.languageLUT[tab.id]
      var languageMatch = findLanguageMatch(this.languages)
      var ratio
        , byte
        , colorArray

      if (languageMatch) {
        ratio = pageLanguages[languageMatch].all / pageLanguages.all
        byte = 128 - Math.round(128 * ratio)
        colorArray = [byte, byte, byte, 255] // always opaque
        
        this.setIcon(tab, "ready")

        chrome.browserAction.setBadgeBackgroundColor({
          tabId: tab.id
        , color: colorArray
        })
        chrome.browserAction.setBadgeText({
          tabId: tab.id
        , text: languageMatch
        })
      } else {
        this.setIcon(tab, "inactive")
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
     * SOURCE: Called by shareLanguageData if the page is set to
     *         autoActivate, and by activateExtension via
     *         asyncTreatTab (originally starting from the
     *         popup)
     * ACTION: * Shows the active icon
     *         * If the call came from the popup, replies with the
     *           autoActivate status of this page, for the
     *           "always" checkbox
     *         * TODO: activates the extension for this tab
     * @param {object}   tab      active tab object
     * @param {function} response callback for popup.js, 
     * NOTE:   During debugging, the response function may report that
     *         it is no longer valid. If you avoid using the debugger
     *         it should work asynchronously as advertised.
     */
  , addToActiveTabs: function addToActiveTabs(tab, response) {
      var url
        , autoActivate

      this.setIcon(tab, "active")

      if (response instanceof Function) {
        url = tab.url
        autoActivate = this.autoActivate.indexOf(url) > -1
        response({ autoActivate: autoActivate })
      }

      this.ensureNoteBookWindowIsOpen()
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
        Tools.deleteFromArray(this.autoActivate, tab.url)
      }

      localStorage.setItem(
        "autoActivate"
      , JSON.stringify(this.autoActivate)
      )
    }

    /**
     * SOURCE: Sent by state_changed (via asyncTreatTab), 
     *         addToActiveTabs and updateIcon
     * @param {object}  tab            tab to which this icon applies
     * @param {string}  state          "inactive"|"ready"|"active"
     * @param {boolean} checkForLanguages true if the extension has 
     *                                 been disactivated in the popup,
     *                                 in which case the "ready" state
     *                                 may need to be applied in a
     *                                 second pass
     */
  , setIcon: function setIcon(tab, state, confirm) {
      var message = {
          tabId: tab.id
        , path: this.icons[state]
        }

      chrome.browserAction.setIcon(message)
      // this.tabMap[tab.id] = state === "active"
      if (state === "active") {
        Tools.addToArray(this.activeTabs, tab.id)
      } // DELETE IF NOT?

      if (confirm) {
        this.updateIcon(tab)
      }
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
        method: "addToActiveTabs"
      , arguments: [response]
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
            method: "setIcon"
          , arguments: [value ? "active" : "inactive", !value]
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

  // function useExtension() {
  //   extension.useExtension.call(extension)
  // }

  function tabChanged(tabId, changedInfo, tab) { // NEW
    extension.tabChanged.call(extension, tabId, changedInfo, tab)
  }

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method]
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
  // chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(treatMessage)
  chrome.tabs.onRemoved.addListener(tabChanged) // NEW
  chrome.tabs.onUpdated.addListener(tabChanged);
})()

