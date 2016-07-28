"use strict"

;(function content(){

  var toolbar = new Toolbar()

  function Toolbar() {
    this.selectedText = ""
    this.extensionIsActive = false

    chrome.runtime.sendMessage(
      { method: "getExtensionStatus" }
    , updateStatus
    )

    function updateStatus(result) {
      toolbar.extensionIsActive = result.extensionIsActive
      toolbar.checkSelection()
    }
  } 

  Toolbar.prototype.insertToolbar = function insertToolbar(request) {
    // { method: "insertToolbar"
    // , html: <html string>
    // }
    
    var body = document.body
    appendToBody(request.html)
    body.classList.add("lxo-annotations")
    this.extensionIsActive = true

    var close = document.querySelector(".lxo-toolbar a.close")
    close.addEventListener("click", function () {
      toolbar.removeToolbar.call(toolbar)
    }, false)

    function appendToBody(htmlString) {
      var parser = new DOMParser() // used multiple times
      var tempDoc = parser.parseFromString(htmlString, "text/html")
      var children = tempDoc.body.childNodes
      var total = children.length
      
      for (var ii = 0; ii < total; ii += 1) {
        body.appendChild(children[0])
      }
    }
  }

  Toolbar.prototype.removeToolbar = function removeToolbar() {
    if (!this.extensionIsActive) {
      return
    }

    var toolbar = document.querySelector("section.lxo-toolbar")
    toolbar.parentNode.removeChild(toolbar)
    document.body.classList.remove("lxo-annotations")

    chrome.runtime.sendMessage({ method: "forgetExtension" })

    this.extensionIsActive = false
  }

  Toolbar.prototype.checkSelection = function checkSelection() {
    if (!this.extensionIsActive) {
      return
    }

    var selection = document.getSelection()
    var text = selection.toString()

    if (this.selectedText !== text) {
      this.selectedText = text

      chrome.runtime.sendMessage({
        method: "changeSelection"
      , data: this.selectedText
      })
    }
  }

  // LISTENERS // LISTENERS // LISTENERS // LISTENERS // LISTENERS //

  function checkSelection(event) {
    toolbar.checkSelection.call(toolbar)
  }

  document.body.addEventListener("mouseup", checkSelection, false)
  document.body.addEventListener("keyup", checkSelection, false)

  function treatMessage(request, sender, sendResponse) {
    var method = toolbar[request.method]

    if (typeof method === "function") {
      method.call(toolbar, request, sender, sendResponse)
    } 
  }

  chrome.extension.onMessage.addListener(treatMessage)
})()