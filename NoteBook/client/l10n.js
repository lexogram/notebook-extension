"use strict"

var Session

;(function l10n(){
  var nativeSelector = document.querySelector("select[name=native]")
  var targetSelector = document.querySelector("select[name=target]")
  var templateStart = '<option value="'
  var templateEnd = '</option>'
  var l10nMap = (function l10nMap() {
    return { "en": {
        "en": "English"
      , "fr": "French"
      , "ja": "Japanese"
      , "ru": "Russian"
      , "sr": "Serbian (Cyrillic)"
      , "sh": "Serbian (Latin)"
      , "fi": "Finnish"
      , "th": "Thai"
      }
    , "fr": {
        "en": "anglais"
      , "fr": "français"
      , "ja": "japonais"
      , "ru": "russe"
      , "sr": "serbe (cyrillique)"
      , "sh": "serbe (latin)"
      , "fi": "finlandais"
      , "th": "thaïlandais"
      }
    , "ja": {
        "en": "英語"
      , "fr": "フランス語"
      , "ja": "日本語"
      , "ru": "ロシア"
      , "sr": "セルビア語（キリル文字）"
      , "sh": "セルビア語（ラテン）"
      , "fi": "フィンランド語"
      , "th": "タイの"
      }
    , "ru": {
        "en": "английский"
      , "fr": "Французский"
      , "ja": "японский"
      , "ru": "русский"
      , "sr": "сербский (кириллица)"
      , "sh": "сербский (латиница)"
      , "fi": "финский"
      , "th": "тайский"
      }
    , "sr": {
        "en": "енглески"
      , "fr": "француски"
      , "ja": "јапански"
      , "ru": "руски"
      , "sr": "cрпски (Ћирилица)"
      , "sh": "cрпски (латин)"
      , "fi": "фински"
      , "th": "тајландски"
      }
    , "sh": {
        "en": "engleski"
      , "fr": "francuski"
      , "ja": "japanski"
      , "ru": "ruski"
      , "sr": "srpski (ćirilica)"
      , "sh": "srpski (latin)"
      , "fi": "finski"
      , "th": "tajlandski"
      }
    , "fi": {
        "en": "englanti"
      , "fr": "ranskalainen"
      , "ja": "japanilainen"
      , "ru": "venäjän kieli"
      , "sr": "serbian (kyrillinen)"
      , "sh": "serbian (latin)"
      , "fi": "suomalainen"
      , "th": "thaimaalainen"
      }
    , "th": {
        "en": "อังกฤษ"
      , "fr": "ฝรั่งเศส"
      , "ja": "ชาวญี่ปุ่น"
      , "ru": "รัสเซีย"
      , "sr": "เซอร์เบีย (ริลลิก)"
      , "sh": "เซอร์เบีย (ละติน)"
      , "fi": "ฟินแลนด์"
      , "th": "ไทย"
      }
    }
  })()
  var nativeDefault = Object.keys(l10nMap)
  var targetDefault = nativeDefault[1]
  nativeDefault = nativeDefault[0]

  Session = {
    map: {}
  , listeners: []
  , get: function get (key) {
      return this.map[key]
    }
  , set: function set (key, value) {
      this.map[key] = value
      localStorage.setItem("session", JSON.stringify(this.map))
      this.broadcast()
      return value
    }
  , register: function register(listener) {
      if (listeners.indexOf(listener) < -1) {
        listeners.push(listener)
      }
    }
  , broadcast: function broadcast() {
      for (var ii=0, total=this.listeners.length; ii<total; ii+=1) {
        listeners[ii](this.map)
      }
    }
  , initialize: function initialize() {
      try {
        this.map = JSON.parse(localStorage.getItem("session")) || {}
      } catch (e) {
        this.map = {}
      }
      return this
    }
  }.initialize()

  ;(function initializeLanguageSelectors() {
    var nativeCode = Session.get("nativeCode")
    var options = ""
    var endonym

    // Create a set of options with the language's own name for itself
    for (var key in l10nMap) {
      endonym = l10nMap[key][key]
      options += templateStart + key + '">' + endonym + templateEnd
    }

    nativeSelector.innerHTML = options

    // Set up event listeners
    nativeSelector.onchange = changeNativeLanguage
    targetSelector.onchange = changeTargetLanguage

    // Initialize target language selector
    changeNativeLanguage.call({}, null, nativeCode)
  })()

  function changeNativeLanguage(event, nativeCode) {
    // <this> may be:
    // * {} if the call came from initializeLanguageSelectors
    // * the select element if it has been clicked, in which case
    //   it has a .value property
    // * { value: "xx" } if the call came from changeTargetLanguage
    //   because the target language is the same as the native 
    //   language
    // <event> is ignored
    // <nativeCode> will be
    // * undefined unless
    // * the call came from initializeLanguageSelectors on a second
    //   or subsequence launch in which case it will be an "xx" code
  
    var currentTarget = Session.get("targetCode")
    var currentNative = Session.get("nativeCode")

    if (!nativeCode) {
      // This is the first startup, or the reaction to a click on one
      // of the select elements
      nativeCode = this.value || nativeDefault
      Session.set("nativeCode", nativeCode)
    }

    nativeSelector.value = nativeCode
    updateTargetLanguageSelector(nativeCode, currentNative)

    if (nativeCode === currentTarget) {
      changeTargetLanguage.call({ value: currentNative})
    } else {
      tellBackground({
        method: "setLanguages"
      , nativeCode: nativeCode
      , targetCode: currentTarget
      })
    }
  }

  function changeTargetLanguage() {
    var currentNative = Session.get("nativeCode")
    var targetCode = this.value
    var currentTarget

    if (targetCode === currentNative) {
      currentTarget = Session.get("targetCode")
    }

    Session.set("targetCode", targetCode)
    targetSelector.value = targetCode

    if (currentTarget) {
      changeNativeLanguage.call({ value: currentTarget })
    } else {     
      tellBackground({
        method: "setLanguages"
      , nativeCode: currentNative
      , targetCode: targetCode
      })
    }
  }

  function updateTargetLanguageSelector(nativeCode, formerNative) {
    var targetCode = Session.get("targetCode")
    var exonyms = l10nMap[nativeCode]
    var options = ""
    var exonym
      , option

    if (!targetCode) {
      targetCode = Session.set("targetCode", targetDefault)
    }

    if (targetCode === nativeCode) {
      targetCode = formerNative
      Session.set("targetCode", targetCode)
    }

    for (var key in exonyms) {
      exonym = exonyms[key]
      if (key === targetCode) {
        option = templateStart+key+'" selected>'+exonym+templateEnd
      } else {
        option = templateStart + key + '">' + exonym + templateEnd
      }
      options += option
    }

    targetSelector.innerHTML = options
  }

})()