/** PANELS ** 
*
* This script creates 6 widgets:
* - A simple panel with a div and an icon at the top
* - A panel set, where clicking on an icon will raise the div to fill
*   the space available
* - A simple tab (inheriting from panel) with an icon on the right
* - A tabset (inheriting from panelset) which opens tabs to the right
* - A two-field translator widget, where the translation field can
*   be hidden, or scrolled as a slave, with a button to open the
*   translate.google.com tab in the main window
* - A settings tab where Native and Target languages can be set
*
* REQUIREMENTS
* - css/styles.css is needed for the layout, opening and closing of
*   panels, tabs and disclosure
* - session.js is needed for the Session global, used to store the
*   activePanel, and native- and target-language codes
* - l10n.js is required for setSelector() calls to show the names of
*   languages
* - connection.js is required for tellBackground
*/

;(function create_panel($){
  "use strict"

  $.widget(
    "lxo.panel"

  , {
      options: {
        icon: 'data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#ccc"/></svg>'
      , iconSize: 48
      , html: "<div></div>"
      , className: "lxo-panel"
      , class: ""
      , rank: 0
      , id: "id_" + Math.floor(Math.random() * 100000)
      }   

    , _create: function panel_create () {
        this._modifyDOM("left")
        this._initialize()
        this._setUserActions()
      } 

    , _modifyDOM: function panel_modifyDOM(edge) {
        var options  = this.options
        var $panel   = this.element
        var offset   = {}
        offset[edge] = (options.iconSize + options.spacing)
                     * options.rank
                     + options.spacing
        
        this.$icon  = $("<img />")
                      .attr("src", options.icon)
                      .addClass("icon")
                      .offset(offset)

        $panel.attr("id", options.id) 
              .addClass(options.className) 
              .addClass(options.class)
              .append(this.$icon)

        if (options.src) {
          $panel.append($("<div></div>")
                        .append($("<iframe></iframe")
                                .attr("src", options.src)))
          // HACK required. When the Wiktionary page is shown in an
          // iFrame, the bottom is 12px too high without this hack
          Hack.tweakCSSDeclaration({
            selector: ".lxo-panels"
          , property: "bottom"
          , pause: 0
          , delay: 1000
          })
        } else if (options.ui) {
          $panel[options.ui](options.uiOptions)
        }
      }

    , _initialize: function initialize() {
        var method = this.options.init
        if (method instanceof Function) {
          method.call(this, this)
        }
      }

    , _setUserActions: function _setUserActions() {
        // var events = this.options.on
        // var event
        //   , action

        // for (event in events) {
        //   action = events[event]
        //   if (action.find) {
        //     this.element.find(action.find).on(event, action.listener)
        //   }          
        // }
      }
    }
  )
})(jQuery)



;(function create_tab($){
  "use strict"

  $.widget(
    "lxo.tab"
  , $.lxo.panel

  , { 
      options: {}

    , _create: function tab_create() {
        this._modifyDOM("top")
      }
    }
  )
})(jQuery)



;(function create_panelset($){ 
  "use strict"

  $.widget(
    "lxo.panelset"

  , {
      options: {
        panels: [{}]
      , className: "lxo-panels"
      , iconSize: 48
      , spacing: 12
      , top: 200
      , default: 0
      }

  //, panels: []
    
    , _create: function panelset_create () {
        var activeIndex = (function getActiveIndex(panels, id) {
          var activeIndex = -1
          var panelOptions = panels.find(function(panel) {
            activeIndex += 1
            return panel.id === id
          })
          
          if (!panelOptions) {
            activeIndex = 0
          }

          return activeIndex
        })(this.options.panels, this.options.default)

        this.panels = [] // local to this instance
        this._modifyDOM() 
        this._setUserActions()
        // this.panels is now populated
        this.toggleActive(this.panels[activeIndex], true)
      } 

    , _modifyDOM: function panelset_modifyDOM () {
        var $parent = this.element
        var options = this.options
        var panels  = options.panels
        var panelOptions
        var widget
        var $panel
        var icon
        var offset
        
        $parent.addClass(options.className)
               .css({ top: options.top })

        for (var ii = 0, total = panels.length; ii < total; ii ++) {
          $panel = $("<div></div>")
          panelOptions = panels[ii]
          if (!(widget = panelOptions.widget)) {
            widget = "panel"
          }

          panelOptions.rank = ii
          panelOptions.spacing = this.options.spacing
          $panel[widget](panelOptions)
          $parent.append($panel)

          this.panels.push($panel)
        }
      }
      
    , _setUserActions: function panelset_setUserActions() {
        var self = this
        var panels = this.panels
        var total = panels.length

        for (var ii = 0; ii < total; ii += 1) {
          addAction(panels[ii])
          
          function addAction(panel){
            var $panel = panel.data("lxo-panel")
                      || panel.data("lxo-tabset")
                      || panel.data("lxo-tab")
            var $element = $panel.element
            var $icon = $panel.$icon
            var $other

            $panel.$icon.on("mouseup", function openPanel() {
              for (var ii = 0; ii < total; ii += 1) {
                $other = panels[ii]
                $other = $other.data("lxo-panel")
                      || $other.data("lxo-tabset")
                      || $other.data("lxo-tab")
                
                if ($other.element !== $panel.element) {
                  self.toggleActive($other.element, false)
                }
              }

              if(!$panel.element.hasClass("active")) {
                self.toggleActive($panel.element, true)
              }
             
              // HACK required. When a tab widget slides horizontally
              // to the left, the icon is trimmed at the right rather
              // than pushed off-screen to the left
              Hack.tweakCSSDeclaration({
                selector: ".lxo-tab > .icon"
              , property: "right"
              , pause: 500
              , delay: 0
              })
            })
          }
        }       
      }

    , toggleActive:  function toggleActive($panel, makeActive) {
        if (makeActive) {
          $panel.addClass("active")
          Session.set("activePanel", $panel[0].id)
        } else {
          $panel.removeClass("active")
        }
      }

    , setTop: function setTop(top) {
        this.element.css({ top: top })
      }
    }
  )
})(jQuery)



;(function create_tabset($){
  "use strict"

  $.widget(
    "lxo.tabset"
  , $.lxo.panelset

  , { options: {}

  //, panels: []

    , _modifyDOM: function panelset_modifyDOM () {
        var options = this.options
        var offset  = (options.iconSize + options.spacing)
                    * options.rank
                    + options.spacing
        this.$icon  = $("<img />")
                      .attr("src", options.icon)
                      .addClass("icon")
                      .offset({left: offset})
        
        options.panels.forEach(function(panel) {
          panel.widget = "tab"
        })

        this._super()

         // Set icon, remove setting for top
        this.element.append(this.$icon)
        this.element[0].style.removeProperty("top")    
      }
    }
  )
})(jQuery)



;(function create_translator($){
  "use strict"

  $.widget(
    "lxo.translator"

  , {
      options: {
        maxHeight: 200
      , resize: function(height) { console.log("resize", height) }
      , className: "lxo-translator"
      }

    // , $syncScroll: 0
    // , $disclosure: 0
    // , $input: 0
    // , $tranlation: 0
    // , $goSource: 0
    // , $hr: 0
    
    , _create: function translator_create () {
        var self = this
        this._modifyDOM()
        setTimeout(function (){
          self._setUserActions()       
        }, 1)
      } 

    , _modifyDOM: function translator_modifyDOM () {
        var $parent = this.element
        var showTranslation = Session.get("showTranslation")
        var $element

        $parent.addClass(this.options.className)

        this.$syncScroll = ($("<input type='checkbox'>")
                           .attr("id", "sync-scroll")
                           .attr("checked", "true"))
        this.$disclosure = $("<input type='checkbox'>")
                           .attr("id", "toggle-output")
                           .attr("checked", showTranslation)
        this.$input      = $("<p></p>")
                           .attr("id", "selection")
        this.$output     = $("<p></p>")
                           .attr("id", "translation")
        this.$goSource   = $("<button type='button'></button>")
                           .attr("id", "show-source")
                           .attr("disabled", true)
        this.$hr         = $("<hr />")

        //$parent.addClass("collapsed")

        $element = $("<div></div>")
                   .attr("id", "input")
                   .append(this.$input)

        $parent.append($element)
               .append(this.$syncScroll)
               .append($("<label></label>")
                       .attr("for", "sync-scroll"))

        $element = $("<div></div>")
                   .attr("id", "output")
                   .append(this.$disclosure)
                   .append($("<label></label>")
                           .attr("for", "toggle-output"))
                   .append(this.$output)
                   .append(this.$goSource)
        $parent.append($element)
               .append(this.$hr)
      }
          
    , _setUserActions: function translator_setUserActions() {
        var self = this
        var $parent = this.element
        var $syncScroll = this.$syncScroll
        var $input = this.$input
        var $output = this.$output
        var $hr = this.$hr

        var border = parseInt($output.css("border-top-width"),10)
        var minHeight = $input.outerHeight()
        var collapseSize = minHeight

        // SyncScroll
        this.$syncScroll.change(function () {
          toggleSyncScroll()
        })

        // Disclosure
        this.$disclosure.change(function () {
          var showTranslation = $(this).is(':checked')

          if (showTranslation) {
            showOutput()
          } else {
            hideOutput()
          }

          self.callbackWithNewHeight()
          Session.set("showTranslation", showTranslation)

          function showOutput() {
            var fullHeight = $input.outerHeight() / 2 + border

            prepareFullHeight($input)
            $input.outerHeight(fullHeight)
            prepareFullHeight($output)
            $output.outerHeight(fullHeight)

            $parent.removeClass("collapsed")
          }

          function hideOutput() {
            prepareFullHeight($input)
            $input.outerHeight(collapseSize)

            $output.height(0)

            $parent.addClass("collapsed")
          }
        })

        // Google
        this.$goSource.click(function () {
          tellBackground({
            method: "moveGoogleTabToFront"
          })
        })

        // Resize
        $hr.on("mousedown", startDrag)

        toggleSyncScroll()

        function toggleSyncScroll() {
          if ($syncScroll.is(':checked')) {
            $input.on("scroll", syncScroll)
            syncScroll()
          } else {
            $input.off("scroll", syncScroll)
          }
        }

        function syncScroll() {
          var master = $input[0]
          var slave = $output[0] 
          var maxScroll = master.scrollHeight - master.clientHeight
          var ratio = master.scrollTop / maxScroll
          maxScroll = slave.scrollHeight - slave.clientHeight
          slave.scrollTop = ratio * maxScroll  
        }

        function startDrag(event) {
          var body = document.body
          var collapsed = $parent.hasClass("collapsed")
          var startY = event.clientY

          var inputStartHeight = $input.outerHeight()
          var minDelta = minHeight - inputStartHeight
          var maxDrag = self.options.maxHeight - $parent.outerHeight()

          body.addEventListener("mousemove", drag, false)
          body.addEventListener("mouseup", stopDrag, false)
          $(body).css("cursor", "row-resize")

          function drag(event) {
            var deltaY = Math.min(event.clientY - startY, maxDrag)

            if (!collapsed) {
              deltaY /= 2
              prepareFullHeight($output)
              $output.outerHeight(inputStartHeight + deltaY)
            }

            prepareFullHeight($input)
            $input.outerHeight(inputStartHeight + deltaY)

            self.callbackWithNewHeight()
          }

          function stopDrag(event) {
            body.removeEventListener("mousemove", drag, false)
            body.removeEventListener("mouseup", stopDrag, false)
            collapseSize = $input.outerHeight()
                         + $output.outerHeight()
                         - border * 2
            $(body).css("cursor", "default")
          }
        }

        function prepareFullHeight($element, height) {
          $element.css("overflow-y", "hidden")
          setTimeout(function () {
            $element[0].style.removeProperty("overflow-y")
          }, 1)
        }
      }

    , getTop: function getTop() {
        return this.element.outerHeight()
      }

    , callbackWithNewHeight: function callbackWithNewHeight() {
        this.options.resize(this.getTop())
      }
    }
  )
})(jQuery)



;(function create_language_settings($){
"use strict"

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

          Session.set("nativeCode", nativeCode)
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

          Session.set("targetCode", targetCode)

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



;(function create_notebook($){
  "use strict"

  $.widget(
    "lxo.notebook"

  , {
      options: {
        separation: 300
      , default: 0
      }
    
    , _create: function notebook_create () {
        this._modifyDOM() 
        this._setUserActions()  
      } 

    , _modifyDOM: function notebook_modifyDOM () {
        var self = this
        var $parent = this.element
        var separation = this.options.separation

        var options = {
          maxHeight: separation
        , resize: function (height) {
            self.resizeTranslator.call(self, height)
          }
        }
        var $translator = $("<div></div>").translator(options)
        $parent.append($translator)
               
        var top = $translator.translator("getTop")

        options = {
          panels: [ 
            { id: "settings"
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
          , { id: "google"
            , icon: "img/google.png" 
            , class: "green"
            }
          // , { id: "wiktionary"
          //   , icon: "img/wiktionary.png" 
          //   , class: "red"
          //   }
          , { id: "wiktionary"
            , icon: "img/wiktionary.png" 
            , src: "https://www.wiktionary.org/"
            , init: function(panel) {
                Session.register({
                  method: function getFrameHeight(key, value) {
                    var height = value["wiktionary.org"]
                    this.element.find("iframe").height(height)
                    this.element.find("div")[0].scrollLeft = 160
                  }
                , key: "iFrameHeights"
                , scope: panel
                , immediate: false
                })   
              }
            }
          ]
        , default: this.options.default
        , top: top
        }
        this.$panelset = $("<div></div>").panelset(options)
        $parent.append(this.$panelset)
      }
          
    , _setUserActions: function notebook_setUserActions() {
      }

    , resizeTranslator: function resizeTranslator(height) {
        this.$panelset.panelset("setTop", height)
      }
    }
  )
})(jQuery)



;(function ready(){
  "use strict"

  var activePanel = Session.get("activePanel")

  $("body").notebook({
    separation: 200
  , default: activePanel
  })
})()