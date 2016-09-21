/** INITIALIZE **
 *
 * Sets the `ready` Session variable to true, so that all listeners
 * will receive a notification
 */

;(function initialize(){
  "use strict"

  window.onresize = saveWindowPosition

  Session.register({
    method: hideBackground
  , key: "status"
  , immediate: false
  })

  Session.set("status", "initialized")

  function saveWindowPosition(event) {
    var window = event.target
    var rect = {
      left: window.screenLeft
    , top: window.screenTop
    , width: window.outerWidth
    , height: window.outerHeight
    }

    Session.set("noteBookRect", rect, true)
  }

  function hideBackground(key, value) {
    if (value !== "ready") {
      return
    }
      
    var delay = 500 + Session.get("seconds") - + new Date() 
    setTimeout(function () {
      document.getElementById("background").classList.remove("splash")
    }, delay)
  }
})()