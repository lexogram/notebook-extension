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
        this.map = JSON.parse(localStorage.getItem("session"))
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
      , option

    for (var key in l10nMap) {
      endonym = l10nMap[key][key]
      option = templateStart + key + '">' + endonym + templateEnd
      options += option
    }

    nativeSelector.innerHTML = options
    nativeSelector.onchange = changeNativeLanguage
    targetSelector.onchange = changeTargetLanguage
    changeNativeLanguage(null, nativeCode)
  })()

  function changeNativeLanguage(event, nativeCode) {
    if (!nativeCode) {
      nativeCode = this.value
      Session.set("nativeCode", nativeCode)
    }

    setSelected(nativeSelector, nativeCode)
    updateTargetLanguageSelector(nativeCode)
  }

  function changeTargetLanguage() {
    var targetCode = this.value
    Session.set("targetCode", targetCode)
    setSelected(this, targetCode)
  }

  function setSelected(selectElement, languageCode) {
    var selector = "option[selected]"
    selector = selectElement.querySelector(selector)
    if (selector) {
      selector.removeAttribute("selected")
    }

    selector = "option[value="+languageCode+"]"
    selector = selectElement.querySelector(selector)
    selector.setAttribute("selected", true)
  }

  function updateTargetLanguageSelector(nativeCode) {
    var targetCode = Session.get("targetCode")
    var exonyms = l10nMap[nativeCode]
    var options = ""
    var exonym
      , option

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