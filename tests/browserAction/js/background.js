;(function background(){
  "use strict"
  
  var extension = {
    languages: {
      "en": ["all"]
    }

  , setIcon: function setIcon(request, sender) {
      request.data.tabId = sender.tab.id
      chrome.browserAction.setIcon(request.data)
    }

  , shareLanguageData: function shareLanguageData(request, sender) {
      var pageLanguages = request.data
      var languageMatch = findLanguageMatch(this.languages)
      var countryMatch

      if (languageMatch) {
        chrome.browserAction.setIcon({
          tabId: sender.tab.id
        , path: "img/Blue19.png"
        })
      }

      function findLanguageMatch(languagesOfInterest) {
        var match = false
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
                match = true
                break
              }
            }
          }
        }

        return match
      }
    }
  }

  function treatMessage(request, sender, sendResponse) {
    var method = extension[request.method]
    if (typeof method === "function") {
      method.call(extension, request, sender, sendResponse)
    }
  }
  
  chrome.runtime.onMessage.addListener(treatMessage)
})()