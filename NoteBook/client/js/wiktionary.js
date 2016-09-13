/** WIKTIONARY **
* 
* Custom script for showing the Wiktionary entry for the text selected
* in p#selection in a div#wiktionary iframe, if that panel is 
* currently active. If it is not active, the last request is stored
* locally and the call is made only when the panel is activated.
* 
*/

;(function wiktionary(){
  "use strict"

  var panelName = "wiktionary"
  var panel = document.getElementById(panelName)
  var wikiURL = ["https://"
  , ".wiktionary.org/w/index.php?title="
  , "&printable=no"
  ]
  var iFrame
  var lastRequest

  Session.register({
    method: activate
  , key: "activePanel"
  })
  Session.register({
    method: newSelection
  , key: "meaning"
  })

  /**
   * Listener for when the wiktionary panel is activated
   * SOURCE: Called by Session.register() when this method is
   *         registered and Session.broadcast() following a call to
   *         Session.set("activePanel") in panelset toggleActive()
   * ACTION: If panelId is "wiktionary" and lastRequest is set,
   *         updates the src of the iFrame. 
   * @param  {string} key     will be "activePanel"
   * @param  {string} panelId may be "wiktionary", or any other value
   */
  function activate(key, panelId) {
    if (panelId !== panelName) {
      return
    }

    if (!iFrame) {
      iFrame = panel.querySelector("iframe")
    }

    if (iFrame && lastRequest) {
      updateFrame(lastRequest)
    }
  }
  
  /**
   * Listener for changes to Session.map.meaning
   * Session.set("meaning", { word: <string>, lang: <ISO code > }) is
   * called by requestMeaning() in selection.js
   * SOURCE: Sent by Session.broadcast()
   * ACTION: Updates the URL of the iframe#wiktionary
   * @param  {string} key  will be "meaning"
   * @param  {object} data should be an object map with the format
   *                       { word: <string>, lang: <ISO code string> }
   *                       data.lang is currently ignored
   */
  function newSelection(key, data) {
    if (data && data.text) {
      if (panel.classList.contains("active")) {
        updateFrame(data)
      } else {
        lastRequest = data
      }
    }
  }

  /**
   * SOURCE: Triggerd by newSelection() if the Wiktionary panel is
   *         active and by activate() if a prior request has been 
   *         saved
   * @param  {object} data will be an object map with the format
   *                       { word: <string>, lang: <ISO code string> }
   *                       data.lang is currently ignored
   */
  function updateFrame(data) {
    var code = Session.get("nativeCode")   
    var url = wikiURL[0] + code + wikiURL[1] + data.text + wikiURL[2]

    if (iFrame) {
      iFrame.src = url
    } else {
      console.log("Wiktionary iframe not defined in newSelection")
    }
    
    lastRequest = undefined
  }
})()