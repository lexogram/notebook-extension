/** POPUP **
 *
 * This script deals with four issues:
 *  1. Displaying the popup window with the appropriate
 *     - user data
 *     - items checked
 *     - background colours
 *     - open status
 *  2. Communicating new settings to the background page, where they
 *     can be applied globally or to the current page, as required
 *  3. Registering a new user
 *  4. Logging in to an existing account
 *
 * Item 1 relies on receiving data from the background script in the
 *        setPageStates callback.
 * Item 2 sends a chrome.runtime.message to the background in 
 *        inputValueChanged
 * Items 3 and 4 show a hidden div, and communicate with the
 *        background. Registration will change the colour and default
 *        open status of the details element.
 */

;(function popup(){
  "use strict"

  var popup = {
    panels: []
  , details: 0

  , initialize: function initialize() {
      var self = this
      this.panels = [].slice.call(document.querySelectorAll(".panel"))
      this.details = document.querySelector("#account details")

      // Prepare to handle user input
      document.getElementById("settings").onchange = function(event) {
        self.inputValueChanged.call(self, event)
      }

      document.body.onclick = function (event) {
        self.treatAccounts.call(self, event)
      }

      // Automatically activate the extension and set the state of
      // the "always" checkbox, using a value retrieved from the
      // background's localStorage
      chrome.runtime.sendMessage(
        { method: "activateExtension"
        , async: true
        }
      , function setPageStates(response) {
          // response will be an object map with the format
          // { autoActivate: <boolean>
          // , colorize: <"familiarity" | "frequency" | "none">
          // , users: {
          //     <usenname>: <password hash | 0>
          //   , ...
          //   }
          // }
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
      var target = event.target
      var state = target.checked
      chrome.runtime.sendMessage({
        method: "state_changed"
      , key: target.id
      , value: target.checked
      })
    }

  , treatAccounts: function treatAccounts(event) {
      var target = event.target
      var className = target.className
      var id = className.match(/settings|connect|eye/)
      var panels = this.panels
      var total = panels.length
      var ii
        , panel

      if (id) {
        id = id[0]
      } else {
        return
      }

      if (id === "eye") {
        togglePassword(true)
      } else {
        showActivePane()
      }

      function togglePassword(setMouseOut) {
        var inputs = document.getElementsByClassName("pass")
        var label = target.parentNode.querySelector("[for=eye]")

        if (target.checked) {
          inputs[0].type = "text"
          inputs[1].type = "text"
        } else {
          inputs[0].type = "password"
          inputs[1].type = "password"
        }

        if (setMouseOut) {
          label.onmouseout = function () {
            label.onmouseout = null
            target.checked = false
            togglePassword()
          }
        }
      }

      function showActivePane() {
        className.replace(/connect/, "panel")

        for (ii = 0; ii < total; ii += 1) {
          panel = panels[ii]
          if (panel.id === id) {
            if (id === "connect") {
              panel.className = className
            }
            panel.classList.add("active")

          } else {
            panel.classList.remove("active")
          }
        }
      }

      this.details.removeAttribute("open")

    }
  }.initialize()
})()