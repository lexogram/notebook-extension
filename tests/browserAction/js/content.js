;(function detect_languages(){
  "use strict"

  var languageData = { all: 0 }
  var languages
    , ii
    , total
    , languageArray
    , language
    , languageCode
    , countryCode
    , countries
    , count
    , treeWalker
    , node
    , text    
    , count

  /*
    { en: { 
        US: <char count> 
      , CA: <char count>
      , GB: <char count>
      , all: <char count>
      }
    , ...
    }
   */
  
  languages = [].slice.call(document.querySelectorAll("[lang]"))
  for (ii = 0, total = languages.length; ii < total; ii += 1) {
    languages[ii] = languages[ii].getAttribute("lang")
  }
  
  languages = languages.filter(function (language, index) {
    return languages.indexOf(language) === index
  })

  for (ii = 0, total = languages.length; ii < total; ii += 1) {
    language = languages[ii]
    languageArray = language.split("-")
    languageCode = languageArray[0] 
    countryCode = languageArray[1]

    countries = languageData[languageCode]
    if (!countries) {
      countries = { all: 0 }
      languageData[languageCode] = countries
    }
    
    if (countryCode) {
      countries[countryCode] = 0
    }
  }

  treeWalker = document.createTreeWalker(
    document.body
  , NodeFilter.SHOW_TEXT 
  )

  while (node = treeWalker.nextNode()) {
    language = getLang(node)
    text = node.textContent.replace(/\s/g, "")
    count = text.length

    languageArray = language.split("-")
    languageCode = languageArray[0] 
    countryCode = languageArray[1]

    if (countryCode) {
      languageData[languageCode][countryCode] += count
    }

    languageData[languageCode].all += count
    languageData.all += count
  }

  chrome.runtime.sendMessage({
    method: "shareLanguageData"
  , data: languageData
  })

  /**
   * @param  {textNode} node should be an HTML element or textNode
   * @return {string}   the value of the lang attribute applied to the
   *                    given node, or "" if no lang attribute is 
   *                    defined
   */
  function getLang(node) {
    var lang = ""
    var element = node

    while (!element.closest) {
      element = element.parentNode
    }

    element = element.closest("[lang]")

    if (element) {
      lang = element.getAttribute("lang")
    }

    return lang
  }
})()