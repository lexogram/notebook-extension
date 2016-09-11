"use strict"

;(function wiktionary(){

  var iFrame = document.querySelector("#wiktionary iframe")
  var wikiURL = ["https://"
  , ".wiktionary.org/w/index.php?title="
  , "&printable=no"
  ]

  Session.register(newSelection, "meaning")

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
    var code = Session.get("nativeCode")   
    var url = wikiURL[0] + code + wikiURL[1] + data.word + wikiURL[2]
    if (iFrame) {
      iFrame.src = url
    } else {
      console.log("Wiktionary iframe not defined in newSelection")
    }
    
  }
})()