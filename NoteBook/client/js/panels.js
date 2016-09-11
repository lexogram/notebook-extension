"use strict"

;(function create_panel($, window){
  
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
        this._modifyDOM() 
      } 

    , _modifyDOM: function panel_modifyDOM () {
        var options  = this.options
        var $panel   = this.element
        this.offset  = (options.iconSize + options.spacing)
                     * options.rank
                     + options.spacing
        this.$icon   = $("<img />")
                       .attr("src", options.icon)
                       .addClass("icon")
                       .offset({left: this.offset})

        $panel.attr("id", options.id) 
              .addClass(options.className) 
              .addClass(options.class)
              .append(this.$icon)

        if (options.src) {
          $panel.append($("<iframe></iframe")
                        .attr("src", options.src))
          // HACK required. When the Wiktionary page is shown in an
          // iFrame, the bottom is 12px too high without this hack
          // Hack.tweakCSSDeclaration(".lxo-panels", "bottom", 1000)
        }
      }
    }
  )
})(jQuery, window)



;(function create_panelset($, window){ 
  $.widget(
    "lxo.panelset"

  , {
      options: {
        panels: [{}]
      , className: "lxo-panels"
      , spacing: 12
      , top: 200
      , default: 0
      }

    , panels: []
    
    , _create: function panelset_create () {
        this._modifyDOM() 
        this._setUserActions()
        this.toggleActive(this.panels[this.options.default], true)
      } 

    , _modifyDOM: function panelset_modifyDOM () {
        var $parent = this.element
        var panelOptions
        var $panel
        var panels  = this.options.panels
        
        $parent.addClass(this.options.className)
               .css({ top: this.options.top })

        for (var ii = 0, total = panels.length; ii < total; ii ++) {
          $panel = $("<div></div>")
          panelOptions = panels[ii]
          panelOptions.rank = ii
          panelOptions.spacing = this.options.spacing
          $panel.panel(panelOptions)
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
            var $element = $panel.element
            var $icon = $panel.$icon
            var $other

            $panel.$icon.on("mouseup", function() {
              for (var ii = 0; ii < total; ii += 1) {
                $other = panels[ii].data("lxo-panel")
                
                if ($other.element !== $panel.element) {
                  self.toggleActive($other.element, false)
                }
              }

              if(!$panel.element.hasClass("active")) {
                self.toggleActive($panel.element, true)
              }
            })
          }
        }       
      }

    , toggleActive:  function toggleActive($panel, makeActive) {
        if (makeActive) {
          $panel.addClass("active")
        } else {
          $panel.removeClass("active")
        }
      }

    , setTop: function setTop(top) {
        this.element.css({ top: top })
      }
    }
  )
})(jQuery, window)



;(function create_translator(){
  $.widget(
    "lxo.translator"

  , {
      options: {
        maxHeight: 200
      , resize: function(height) { console.log("resize", height) }
      , className: "lxo-translator"
      }

    , $syncScroll: 0
    , $disclosure: 0
    , $input: 0
    , $tranlation: 0
    , $goSource: 0
    , $hr: 0
    
    , _create: function translator_create () {
        var self = this
        this._modifyDOM()
        setTimeout(function (){
          self._setUserActions()       
        }, 1)
      } 

    , _modifyDOM: function translator_modifyDOM () {
        var $parent = this.element
        var $element

        $parent.addClass(this.options.className)

        this.$syncScroll  = ($("<input type='checkbox'>")
                           .attr("id", "sync-scroll")
                           .attr("checked", "true"))
        this.$disclosure  = $("<input type='checkbox'>")
                           .attr("id", "toggle-output")
        this.$input       = $("<p></p>")
                           .attr("id", "selection")
        this.$output      = $("<p></p>")
                           .attr("id", "translation")
        this.$goSource    = $("<button type='button'></button>")
        this.$hr          = $("<hr />")

        $parent.addClass("collapsed")

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

        this.$syncScroll.change(function () {
          toggleSyncScroll()
        })

        this.$disclosure.change(function () {
          if ($(this).is(':checked')) {
            showOutput()
          } else {
            hideOutput()
          }

          self.callbackWithNewHeight()

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

        function getFullHeight(element) {
          var height
          var restore = element.style.height
          var scrollTop = element.scrollTop

          element.style.height = "auto"
          height = element.offsetHeight
          if (restore) {
            element.style.height = restore
          } else {
            element.style.removeProperty("height")
          }

          element.scrollTop = scrollTop
          
          return height
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
})()



;(function create_notebook(){

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
            { icon: "img/settings.png" 
            , class: "red"
            }
          , { icon: "img/google.png" 
            , class: "green"
            }
          , { icon: "img/wiktionary.png" 
            , id: "wiktionary"
            , src: "https://www.wiktionary.org/"
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
})()



;(function ready(){
  $("body").notebook({
    separation: 200
  , default: 2
  })
})()