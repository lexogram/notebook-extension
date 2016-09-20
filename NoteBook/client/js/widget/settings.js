/** SETTINGS **
 * 
 * Defines a jQuery widget for the Settings panel and its tabs
 */


var Settings

;(function create_language_settings($){
"use strict"

  Settings = {
    getOptions: function getOptions() {
      return {
        id: "settings"
      , icon: "img/settings.png" 
      , widget: "tabset"
      , panels: [
          { id: "languages"
          , icon: "img/languages.png"
          , className: "lxo-tab"
          , class: "blue"
          , ui: "language-settings"
          }
        , { id: "resources"
          , icon: "img/resources.png"
          , className: "lxo-tab"
          , class: "red"
          }
        ]
      , className: "lxo-panel"
      }
    }
  }

  $.widget(
    "lxo.language-settings"

  , {
      options: {

      }

 // , $native: 0
 // , $target: 0

    , _create: function language_settings_create () {
        this._modifyDOM() 
        this._setUserActions() 
      } 

    , _modifyDOM: function language_settings_modifyDOM () {
        var $parent  = this.element
        var nativeCode = Session.get("nativeCode")
        var targetCode = Session.get("targetCode")
       
        this.$native   = $("<select multiple></select>")
                         .attr("name", "native")
        this.$target   = $("<select multiple></select>")
                         .attr("name", "target")
        L10n.setSelector(this.$native, "endonym", nativeCode)
        L10n.setSelector(this.$target, nativeCode, targetCode)

        $parent.append($("<div></div>")
                       .addClass("half")
                       .append($("<img>")
                               .attr("src", "img/native.png")
                               .attr("alt", "Native language")
                               .addClass("noClip"))
                       .append(this.$native))

        $parent.append($("<div></div>")
                      .addClass("half")
                      .append($("<img>")
                              .attr("src", "img/target.png")
                              .attr("alt", "Target language")
                              .addClass("noClip"))
                      .append(this.$target))
      }

    , _setUserActions: function language_selector_setUserActions() {
        var self = this
        this.$native.on("change", changeNativeLanguage)
        this.$target.on("change", changeTargetLanguage)

        function changeNativeLanguage() {
          // <this> will be an object, either the selector itself or
          // { value: <nativeCode>
          // , refresh: true
          // }
        
          var formerNative = Session.get("nativeCode")
          var currentTarget = Session.get("targetCode")
          var nativeCode = this.value
          var anchorId

          Session.set("nativeCode", nativeCode, true)
          L10n.setSelector(self.$target, nativeCode, currentTarget) 

          if (this.refresh) {
            // The call came from changeTargetLanguage, to swap native
            // and target languages
            self.$native.val(nativeCode)
          } else if (nativeCode === currentTarget) {
            // Swap values. changeTargetLanguage will tellBackground
            return changeTargetLanguage.call({
              value: formerNative
            , refresh: true
            })
          }

          anchorId = L10n.getAnchorId(nativeCode, currentTarget)
          Session.set("anchorId", anchorId, true)

          tellBackground({
            method: "setLanguages"
          , nativeCode: nativeCode
          , targetCode: currentTarget
          })
        }

        function changeTargetLanguage() {
          // <this> will be an object, either the selector itself or
          // { value: <nativeCode>
          // , refresh: true
          // }
          
          var formerTarget = Session.get("targetCode")
          var currentNative = Session.get("nativeCode")
          var targetCode = this.value
          var anchorId

          Session.set("targetCode", targetCode, true)

          if (this.refresh) {
            // The call came from changeNativeLanguage, to swap native
            // and target languages
            self.$target.val(targetCode)
          } else if (targetCode === currentNative) {
            // Swap values. changeTargetLanguage will tellBackground
            return changeNativeLanguage.call({
              value: formerTarget
            , refresh: true
            })
          }

          anchorId = L10n.getAnchorId(currentNative, targetCode)
          Session.set("anchorId", anchorId, true)

          tellBackground({
            method: "setLanguages"
          , nativeCode: currentNative
          , targetCode: targetCode
          })
        }
      }
    }
  )
})(jQuery)