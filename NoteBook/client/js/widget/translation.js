/** TRANSLATION ** 
 *
 * This script acts as the interface between the connections object,
 * which receives updates from the background script, and the 
 * p#selection and p#translation elements.
 */

;(function translation(){
  "use strict"

  var translation = {
    pSelection: 0
  , pTranslation: 0
  , pShowSource: 0

   , initialize: function initialize() {
      var self = this

      Session.register({
        method: this.waitForReady
      , key: "status"
      , scope: self
      , immediate: false
      })

      return this
    }

   , waitForReady: function(key, value) {
      if (value !== "ready") {
        return
      }

      var self = this

      this.pSelection = document.getElementById("selection")
      this.pTranslation = document.getElementById("translation")
      this.pShowSource = document.getElementById("show-source")

      Session.register({
        method: function (key, value) {
          self.watchSelection.call(self, key, value)
        }
      , key: "selection"
      , immediate: false
      })

      Session.register({
        method: function (key, value) {
          self.watchTranslation.call(self, key, value)
        }
      , key: "translation"
      , immediate: false
      })
    }

    /**
     * SOURCE: Sent by Session.broadcast() following a call to 
     *         connection.changeSelection() received from the active
     *         content script via the background.
     * @param  {string} key       will be "selection"
     * @param  {string} selection will be
     *                            { text: <text selected in the 
     *                                 active tab of the main window>
     *                            , lang: <"" | language code>
     *                            }
     */
  , watchSelection: function watchSelection(key, selection) {
      if (selection) {
        this.pSelection.textContent = selection.text
      }
    }

    /**
     * SOURCE: Sent by Session.broadcast() following a call to 
     *         connection.showGoogleTranslation() received from the
     *         content script in the translate.google.com tab
     *         via the background.
     * @param  {string} key       will be "translation"
     * @param  {string} selection will be the text of the 
     *                            span#result_box in the google page
     */
  , watchTranslation: function watchTranslation(key, translation) {
      if (translation) {
        this.pTranslation.innerHTML = translation
        this.pShowSource.removeAttribute("disabled")
      }
    }

  }.initialize()
})()



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

        // TreatSelection
        CustomSelection($input[0]) // in selection.js

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
          Session.set("showTranslation", showTranslation, true)

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