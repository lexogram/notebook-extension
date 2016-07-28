"use strict"

;(function content(){

  var selectedText = ""
  var extensionIsActive = false

  document.body.addEventListener("mouseup", checkSelection, false)
  document.body.addEventListener("keyup", checkSelection, false)

  function checkSelection(event) {
    if (!extensionIsActive) {
      return
    }

    var selection = document.getSelection()
    var text = selection.toString()

    if (selectedText !== text) {
      selectedText = text

      chrome.runtime.sendMessage({
        method: "changeSelection"
      , data: selectedText
      })
    }
  }

  function treatMessage(request, sender, sendResponse) {
    switch (request.method) {
      case "extensionStatus":
        extensionStatus(request, sendResponse)
      break
      case "insertToolbar":
        insertToolbar(request)
      break
      case "removeToolbar":
        removeToolbar()
      break
    }   
  }

  // DELETED
    // function extensionStatus(request, sendResponse) {
    //   request.extensionIsActive = extensionIsActive
    //   request.cssInjected = cssInjected

    //   sendResponse(request)
    // }

  function insertToolbar(request) {
    // { method: "insertToolbar"
    // , html: <html string>
    // }
    
    var body = document.body
    var injectedDOM = parseAsElements(request.html)
    appendSectionToBody(injectedDOM)
    body.classList.add("lxo-annotations")
    extensionIsActive = true
    // cssInjected = true

    var close = document.querySelector(".lxo-toolbar a.close")
    close.addEventListener("click", removeToolbar, false)

    return "toolbar inserted"

    function parseAsElements(htmlString) {
      var parser = new DOMParser() // used multiple times
      var tempDoc = parser.parseFromString(htmlString, "text/html")
      return tempDoc.body.childNodes
    }

    function appendSectionToBody(children) {
      var total = children.length
      
      for (var ii = 0; ii < total; ii += 1) {
        body.appendChild(children[0])
      }
    }
  }

  function removeToolbar() {
    if (!extensionIsActive) {
      return
    }

    var toolbar = document.querySelector("section.lxo-toolbar")
    toolbar.parentNode.removeChild(toolbar)
    document.body.classList.remove("lxo-annotations")
    // CHANGED
    chrome.runtime.sendMessage({ method: "forgetExtension" })

    extensionIsActive = false
  }

  // CHANGED
  ;(function setExtensionStatus(){
    chrome.runtime.sendMessage(
      { method: "getExtensionStatus" }
    , updateStatus
    )

    function updateStatus(result) {
      extensionIsActive = result.extensionIsActive
    }
  })()

  chrome.extension.onMessage.addListener(treatMessage)
})()