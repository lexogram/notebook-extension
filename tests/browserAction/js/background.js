/** BACKGROUND **
 * 
 */

;(function background(){
  "use strict"
  
  var extension = {
    languages: {
      "en": ["all"]
    , "ru": ["all"]
    }

  , icons: { // <HARD-CODED>
      inactive: "img/19/inactive.png"
    , ready: "img/19/ready.png"
    , active: "img/19/active.png"
    }

  , languageLUT: {}
  , autoActivate: []

  , initialize: function initialize() {
      this.autoActivate = this.getFromLocalStorage("autoActivate", [])

      return this
    }

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
     * SOURCE: Sent from the content script
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
     *                           }
     *                          The integer values represent the
     *                          number of characters attributed to
     *                          each language on the page.
     * @param  {[type]} sender  will be an object map with the format:
     *                          { ...
     *                          , tab: {
     *                              ...
     *                            , tabId: <integer sender tab id>
     *                            , ...
     *                            }
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

  , activateExtension: function activate(request, sender, response) {
      this.treatTab({
        method: "addToActiveTabs"
      , arguments: [response]
      }) 
    }

  , addToActiveTabs: function addToActiveTabs(tab, response) {
      var url = tab.url
      var autoActivate = this.autoActivate.indexOf(url) > -1

      this.setIcon(tab, "active", false)

      if (response instanceof Function) {
        response({ autoActivate: autoActivate})
      }

      // TODO indicate that the extension is active for this tab
    }

  , toggleAutoActivate: function toggleAutoActivate(tab, state) {
      if (state) {
        Tools.addToArray(this.autoActivate, tab.url)
      } else {
        Tools.deleteFromArray(this.autoActivate, tab.url)
      }
    }

  , treatTab: function treatTab(request) {
      var self = this
      var method = this[request.method]
      var args = request.arguments || []

      if (!(method instanceof Function)) {
        return
      }

      chrome.tabs.query(
        // Uncomment after debugging
        { active: true } //, currentWindow: true }
      , treatRequest
      )

      function treatRequest(tabs) {
        if (!tabs.length) {
          // Popup window is being inspected. Ignore action
          return
        }
        
        args.unshift(tabs[0])
        method.apply(self, args)       
      }
    }

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

  , state_changed: function state_changed(request, sender) {
      var key = request.key
      var value = request.value

      switch (key) {
        case "active":
          this.treatTab({
            method: "setIcon"
          , arguments: [value ? "active" : "inactive", !value]
          })
        break

        case "always":          
          this.treatTab({
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
 
  , test: function test(request, sender, sendResponse) {
      console.log("request", + new Date())
      setTimeout(function delayedResponse() {
        console.log("response", + new Date())
        sendResponse({ response: + new Date() })
      }, 1000)
    }
  }.initialize()

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method]
    if (typeof method === "function") {
      method.call(extension, request, sender, sendResponse)
    }

    if (request.async) {
      console.log(Tools.getMethodName(method), "asnyc")
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