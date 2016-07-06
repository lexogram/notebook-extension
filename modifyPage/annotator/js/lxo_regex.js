;(function unicodeRegex(window){
  var wordRegexes = {
    en: /(\w+)/g
  , ru: /([0-9\u0400-\u04FF-]+)/gu
  }

  window.getLanguageRegexMap = function getRegexMap(languageArray) {
    var map = {}
    var total = languageArray.length
    var ii
      , lang
      , regex
    
    for (ii = 0; ii < total; ii += 1) {
      lang = languageArray[ii]
      regex = wordRegexes[lang]
      if (regex) {
        map[lang] = regex
      }
    }

    return map
  }
})(window)