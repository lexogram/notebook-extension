"use strict"

// Requires global Session

var L10n

;(function l10n(){

  L10n = {
    map: { "en": {
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

    /**
     * SOURCE: Called by language_settings_modifyDOM in panels.js
     * ACTION: Sets the options for the given selector element
     * @param {selector} $selector jQuery object wrapping a selector
     *                             element
     * @param {string}   language  ISO language code or "endonym" for
     *                             language of selector items
     * @param {string}   selected  ISO language code for default
     *                             selection
     */
  , setSelector: function setSelector($selector, language, selected) {
      var templateStart = '<option value="'
      var templateEnd = '</option>'
      var map = this.map[language]
      var endonym = false
      var $option
        , key
        , value

      $selector.empty()

      if (!map) {
        map = this.map
        endonym = true
      }

      for (key in map) {
        value = map[key]

        if (endonym) {
          value = value[key]
        }

        $option = $(templateStart + key + '">' + value + templateEnd)
        $selector.append($option)
      }
      $selector.val(selected)
    }
  }
})()