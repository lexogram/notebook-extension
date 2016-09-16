;(function popup(){
  "use strict"

  var popup = {
    initialize: function initialize() {
      self = this

      // Prepare to handle user input
      document.body.onchange = function(event) {
        self.inputValueChanged.call(self, event)
      }

      // Automatically activate the extension and set the state of
      // the "always" checkbox, using a value retrieved from the
      // background's localStorage
      chrome.runtime.sendMessage(
        { method: "activateExtension"
        , async: true
        }
      , function setAutoActivate(response) {
          var always = document.getElementById("always")
          if ( response.autoActivate ) {
            always.setAttribute("checked", true)
          }
        }
      )

      return this
    }

    /**
     * SOURCE: Triggered by any change to a checkbox or radiobutton
     * @param  {object} event change event
     */
  , inputValueChanged: function inputValueChanged(event) {
      console.log(event)
      var target = event.target
      var state = target.checked
      chrome.runtime.sendMessage({
        method: "state_changed"
      , key: target.id
      , value: target.checked
      })
    }
  }.initialize()
})()