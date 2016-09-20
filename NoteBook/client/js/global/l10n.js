"use strict"

var L10n

;(function l10n(){

  L10n = {
    map: { "en": {
        "en": "English"
      , "fi": "Finnish"
      , "fr": "French"
      , "ja": "Japanese"
      , "ru": "Russian"
      , "es": "Spanish"
      , "th": "Thai"
      , "zh": "Chinese"
      }
    , "fr": {
        "en": "Anglais"
      , "es": "Espagnol"
      , "fi": "Finlandais"
      , "fr": "Français"
      , "ja": "Japonais"
      , "ru": "Russe"
      , "th": "Thaïlandais"
      , "zh": "Chinois"
      }
    , "ja": {
        "en": ["英語", ".E8.8B.B1.E8.AA.9E"]
      , "es": ["スペイン語", ".E3.82.B9.E3.83.9A.E3.82.A4.E3.83.B3.E8.AA.9E"]
      , "fi": ["フィンランド語", ".E3.83.95.E3.82.A3.E3.83.B3.E3.83.A9.E3.83.B3.E3.83.89.E8.AA.9E"]
      , "fr": ["フランス語", ".E3.83.95.E3.83.A9.E3.83.B3.E3.82.B9.E8.AA.9E"]
      , "ja": ["日本語", ".E6.97.A5.E6.9C.AC.E8.AA.9E"]
      , "ru": ["ロシア", ".E3.83.AD.E3.82.B7.E3.82.A2.E8.AA.9E"]
      , "th": ["タイの", ".E3.82.BF.E3.82.A4.E8.AA.9E"]
      , "zh": ["中国語", ".E4.B8.AD.E5.9B.BD.E8.AA.9E"]
      }
    , "ru": {
        "en": ["Английский", ".D0.90.D0.BD.D0.B3.D0.BB.D0.B8.D0.B9.D1.81.D0.BA.D0.B8.D0.B9"]
      , "es": ["Испанский", ".D0.98.D1.81.D0.BF.D0.B0.D0.BD.D1.81.D0.BA.D0.B8.D0.B9"]
      , "fi": ["Финский", ".D0.A4.D0.B8.D0.BD.D1.81.D0.BA.D0.B8.D0.B9"]
      , "fr": ["Французский", ".D0.A4.D1.80.D0.B0.D0.BD.D1.86.D1.83.D0.B7.D1.81.D0.BA.D0.B8.D0.B9"]
      , "ja": ["Японский", ".D0.AF.D0.BF.D0.BE.D0.BD.D1.81.D0.BA.D0.B8.D0.B9"]
      , "ru": ["Русский", ".D0.AF.D0.BF.D0.BE.D0.BD.D1.81.D0.BA.D0.B8.D0.B9"]
      , "th": ["Тайский", ".D0.A2.D0.B0.D0.B9.D1.81.D0.BA.D0.B8.D0.B9"]
      , "zh": ["Китайский", "???"]
      }
    , "es": {       
        "en": "Inglés"
      , "es": "Español"
      , "fi": "Finlandés"
      , "fr": "Francés"
      , "ja": "Japonés"
      , "ru": "Ruso"
      , "th": "Tailandés"
      , "zh": "Chino"
      }
    , "fi": {
        "en": "Englanti"
      , "es": "Espanja"
      , "fi": "Suomi"
      , "fr": "Ranska"
      , "ja": "Japani"
      , "ru": "Venäjä"
      , "th": "Thaimaa"
      , "zh": "Mandariinikiina"
      }
    , "th": {
        "en": ["อังกฤษ", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.AD.E0.B8.B1.E0.B8.87.E0.B8.81.E0.B8.A4.E0.B8.A9"]
      , "es": ["สเปน", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.AA.E0.B9.80.E0.B8.9B.E0.B8.99"]
      , "fi": ["ฟินแลนด์", ".E0.B8.9F.E0.B8.B4.E0.B8.99.E0.B9.81.E0.B8.A5.E0.B8.99.E0.B8.94.E0.B9.8C"]
      , "fr": ["ฝรั่งเศส", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.9D.E0.B8.A3.E0.B8.B1.E0.B9.88.E0.B8.87.E0.B9.80.E0.B8.A8.E0.B8.AA"]
      , "ja": ["ชาวญี่ปุ่น", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.8D.E0.B8.B5.E0.B9.88.E0.B8.9B.E0.B8.B8.E0.B9.88.E0.B8.99"]
      , "ru": ["รัสเซีย", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.A3.E0.B8.B1.E0.B8.AA.E0.B9.80.E0.B8.8B.E0.B8.B5.E0.B8.A2"]
      , "th": ["ไทย", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B9.84.E0.B8.97.E0.B8.A2"]
      , "zh": ["จีน", ".E0.B8.A0.E0.B8.B2.E0.B8.A9.E0.B8.B2.E0.B8.88.E0.B8.B5.E0.B8.99"]
      }
    , "zh": {
        "en": ["英语", ".E8.8B.B1.E8.AA.9E"]
      , "es": ["西班牙语", ".E8.A5.BF.E7.8F.AD.E7.89.99.E8.AF.AD_2"]
      , "fi": ["芬兰语", ".E8.8A.AC.E5.85.B0.E8.AF.AD"]
      , "fr": ["法语", ".E6.B3.95.E8.AF.AD"]
      , "ja": ["日语", ".E6.97.A5.E8.AF.AD"]
      , "ru": ["俄语", ".E4.BF.84.E8.AA.9E"]
      , "th": ["泰语", ".E6.B3.B0.E8.AF.AD"]
      , "zh": ["汉语", ".E6.B1.89.E8.AF.AD"]
      }
    }

    /**
     * SOURCE: Called by language_settings_modifyDOM in panels.js
     * ACTION: Sets the options for the given selector element, 
     *         placing them in alphabetical order by Unicode character
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
        , languages
        , lang
        , ii
        , total
        , value

      $selector.empty()

      if (!map) {
        map = this.map
        endonym = true
      }

      languages = Object.keys(map).sort(byExonym)

      for (ii = 0, total = languages.length; ii < total; ii += 1) {
        lang = languages[ii]
        value = getExonym(lang)

        $option = $(templateStart + lang + '">' + value + templateEnd)
        $selector.append($option)
      }
      $selector.val(selected)

      // TODO: In Thai, the sort order should ignore preceding vowels
      function byExonym(a, b) {
        a = getExonym(a)
        b = getExonym(b)
        var result = a === b ? 0 : (a > b) * 2 - 1
        return result
      }

      function getExonym(lang) {
        value = map[lang]

        if (endonym) {
          value = value[lang]
        }

        if (value instanceof Array) {
          value = value[0]
        }

        return value
      }
    }

  , getAnchorId: function getAnchorId(nativeCode, targetCode) {
      var id = this.map[nativeCode][targetCode]

      if (id instanceof Array) {
        id = id[1]
      }

      return id
    }
  }
})()