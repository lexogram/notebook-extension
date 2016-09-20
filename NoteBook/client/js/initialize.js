/** INITIALIZE **
 *
 * Sets the `ready` Session variable to true, so that all listeners
 * will receive a notification
 */

;(function initialize(){
  "use strict"

  Session.register({
    method: hideBackground
  , key: "status"
  , immediate: false
  })

  Session.set("status", "loaded")

  function hideBackground(key, value) {
    if (value !== "ready") {
      return
    }
      
    var delay = 500 + Session.get("seconds") - + new Date() 
    console.log(delay)
    setTimeout(function () {
      document.getElementById("background").classList.remove("splash")
    }, delay)
  }
})()