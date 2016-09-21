/** SESSION **
*
* Local Storage is used to save preferences for users on the current
* device. This data is read in to the Session object on startup.
* Default values are provided for those keys whose values must be set
* the first time the extension is activated. 

* ALL USERS
*   User IDs (and encrypted passwords)
*   Log in automatically as ...
* PER USER
* ✓ Choice of native and target languages
*   Choice of reference sources
*   Choice of machine translation
*   Choice of default panel
*   Automatically update when switching to an activated tab?
*   Automatic activation by URL
*   - Entire site
*   - Individual page
*   Show familiarity colour (Frequency|Personal familiarity|Blend|Off)
*   - By default
*   - By URL
*
* Session is also used to store:
*   - activePanel: the active panel
*   - selection: the current selection in the content page
*   - meaning: the word(s) selected in p#selection, for further study
*
* Listener functions can be registered to receive notification when
* a particular key value is set.
*/

var Session

;(function session() {
  "use strict"

  Session = {
    map: {
      status: "loading" // initialized | connected | ready
    , seconds: + new Date()
    }

  , listeners: {}

    /**
     * Receives the latest values for this.map from the background on
     * startup.
     */
  , initialize: function initialize(storedSettings) {
      for (var key in storedSettings) {
        this.set(key, storedSettings[key])
      }

      this.set("status", "connected")
    }

  , get: function get(key) {
      return this.map[key]
    }

    /**
     * ACTION: Sets this.map[key] to value, and optionally saves
     *         the updated value of this.map to localStorage. Triggers
     *         any listeners for changes to the value of key
     * @param {string} key   string key to save
     * @param {any} value    value to save for key
     * @param {any} save     if truthy, localStorage will not be 
     *                        updated
     */
  , set: function set (key, value, save) {
      if (typeof key !== "string") {
        return
      }

      this.map[key] = value

      if (save) {
        tellBackground({
          method: "saveToLocalStorage"
        , key: key
        , value: value
        })
      }

      //console.log(key, value, save)

      this.broadcast(key)
      return value
    }

    /**
     * ACTION: Adds a listener to listeners[listener.key], to be 
     *         triggered any time the value of this.map[listener.key]
     *         is set
     * @param  {object} listener object map with the format
     *                           { method: <function>
     *                           , key: <string>
     *                           , scope: <optional scope for this>
     *                           , immediate: <true || falsy>
     *                           }
     */
  , register: function register(listener) {
      var listeners
      var key = listener.key
      var method = listener.method

      if (!(method instanceof Function)) {
        console.log("Expected function in Session.register", listener)
        return
      } else if (typeof key !== "string") {
        return
      }

      listeners = this.listeners[key]
      if (!listeners) {
        listeners = []
        this.listeners[key] = listeners
      }

      if (!listeners.find(reviewListeners, listener)) {
        listeners.push(listener)
      }

      if (listener.immediate !== false) {
        this.trigger(listener, key, this.map[key])
      }

      function reviewListeners(listener) {
        var result = true

        for (var key in this) {
          if (this[key] === listener[key]) {
            result = false
            break
          }
        }

        return result
      }
    }

    /**
     * SOURCE: Triggered by register() and set()
     * ACTION: Triggers any listeners for changes in key
     * @param  {string} key
     */
  , broadcast: function broadcast(key) {
      var value = this.map[key]
      var listeners = this.listeners[key]
      var total
      var ii

      if (listeners) {
        for (ii = 0, total = listeners.length; ii < total; ii += 1) {
          this.trigger(listeners[ii], key, value)
        }
      }
    }

  , trigger: function trigger(listener, key, value) {
      var method = listener.method
      var scope = listener.scope
      
      if (scope) {
        method.call(scope, key, value)
      } else {
        method(key, value)
      }
    }
  }
})()