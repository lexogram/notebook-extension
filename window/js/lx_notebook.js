"use strict"

;(function notebook() {
 
  function Notebook () {
    this.setup()
  }

  Notebook.prototype.setup = function setup() {
    this.fullText = document.querySelector("#full-text")
  }

  Notebook.prototype.showFullText = function showFullText(
    request  // { method: "showFullText", data: <string> }
  , response // { method: "showFullText" }
  ) {
    this.fullText.innerHTML = request.data
    response.error = 0
  }
  
  var notebook = new Notebook()


  function dispatchMessage(request, sender, callback) {
    var method

    //speak("notebook dispatch")
    //console.log(request, sender, callback)

    if (typeof request === "string") {
      method = request
    } else {
      method = request.method
    }

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

  chrome.extension.onMessage.addListener(dispatchMessage)
})()