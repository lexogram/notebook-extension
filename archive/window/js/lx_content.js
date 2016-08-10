"use strict"

// This script is injected into the every page visited by the user
// and is executed on document_end after the DOM is ready.
// 
;(function lx_content(){
  // Listen to messages from the background script
  //speak(pageName())

  chrome.extension.onMessage.addListener(dispatchMessage)

  function dispatchMessage(request, sender, callback) {
    var method

    //console.log(request, sender, callback)

    if (typeof request === "string") {
      method = request
    } else {
      method = request.method
    }

    var response = {
      method: method
    }

    // speak("dispatching " + method)

    switch (method) {
      case "connect":
        connect(response)
      break
      case "getFullText":
        getFullText(response)
      break
    }

    if (callback) {
      callback(response)
    }
  }

  function connect(response) {
    //speak(pageName() + " connected")
    response.data = "connected"
    response.url = "connected"
  }

  function getFullText(response) {
    // speak(pageName() + " getFullText")
    response.data = document.body.innerText
  }

  function pageName() {
    var pagename = window.location.pathname
    var start = pagename.lastIndexOf("/") + 1
    var end = pagename.lastIndexOf(".")
    return pagename.substring(start, end)
  }

  function speak(phrase) {
    console.log(phrase, (+ new Date()) % 100000)
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase))
  }
})()