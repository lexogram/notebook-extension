"use strict"

/**
 * Attached to the lx-content.html page which is displayed in the
 * Popup window. This script handles incoming messages 
 */

;(function notebook() {

  chrome.extension.onMessage.addListener(dispatchMessage)
 
  function Notebook () {
    this.setup()
  }

  Notebook.prototype.setup = function setup() {
    this.fullText = document.querySelector("#full-text")
  }

  /**
   * @source Sent via chrome.tabs.sendMessage (through the 
   *         dispatchMessage method in this script) from 
   *         tellNotebook() in popup.js which receives a call from the
   *         TabTracker object created by background.js
   * @param  {object} request  { method: "showFullText"
   *                           , data: <string>
   *                           }
   * @param  {object} response { method: "showFullText" }
   */
  Notebook.prototype.showFullText = function showFullText(
    request  // { method: "showFullText", data: <string> }
  , response // { method: "showFullText" }
  ) {
    var error = 0
    var text = request.data || (error = true, "No incoming data")

    //speak("showFullText " + text.substring(0, 20))

    this.fullText.innerHTML = text
    response.error = error
  }
  
  var notebook = new Notebook()


  function dispatchMessage(request, sender, callback) {
    var method

    if (typeof request === "string") {
      method = request
    } else {
      method = request.method
    }

    speak("notebook incoming " + method)
    console.log(request, sender, callback)

    var response = {
      method: method
    }

    if (notebook[method]) {
      notebook[method](request, response)
    }

    if (callback) {
      callback(response)
    }
  }

  function speak(phrase) {
    console.log(phrase, (+ new Date()) % 100000)
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase))
  }
})()