/** BACKGROUND **
 *
 * This proof-of-concept version interacts with the content scripts
 * to determine what languages appear to be available on the current 
 * page, in order to show an icon and badge when the languages the
 * user is learning are available.
 *
 * It also interacts with the browserAction popup window to determine
 * react to the Activate and Always Activate checkboxes.
 */

;(function background(){
  "use strict"
  
  var extension = {  
    languages: { // <HARD-CODED for testing>
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

  , initialize: function initialize() {
      this.autoActivate = this.getFromLocalStorage("autoActivate", [])

      return this
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

      this.setIcon(tab, "active", false)

      if (response instanceof Function) {
        url = tab.url
        autoActivate = this.autoActivate.indexOf(url) > -1
        console.log({ autoActivate: autoActivate })
        response({ autoActivate: autoActivate })
      }

      // TODO indicate that the extension is active for this tab
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
  , setIcon: function setIcon(tab, state, checkForLanguages) {
      var message = {
          tabId: tab.id
        , path: this.icons[state]
        }

      chrome.browserAction.setIcon(message)

      if (checkForLanguages) {
        this.updateIcon(tab)
      }
    }

    // LISTENERS // LISTENERS // LISTENERS // LISTENERS // LISTENERS 
    
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
  }.initialize()

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method]
    if (typeof method === "function") {
      method.call(extension, request, sender, sendResponse)
    }

    if (request.async) {
      return true
    }
  }
  
  chrome.runtime.onMessage.addListener(treatMessage)
})()

var Tools = {
  addToArray: function addToArray(array, item) {
    var index = array.indexOf(item)
    if (index < 0) {
      return array.push(item)
    }
  }

, deleteFromArray: function deleteFromArray(array, item) {
    var index = array.indexOf(item)
    if (index < 0) {
      // item is not in the array
    } else {
      return array.splice(index, 1)[0]
    }

  }

, getMethodName: function getMethodName(method) {
    var methodName = "Not a function: "

    if (method instanceof Function) {
      methodName = /^function\s*(\w+)/.exec(method.toString())[1]
    } else {
      methodName += method
    }
    return methodName
  }
}