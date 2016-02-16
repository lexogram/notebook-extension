"use strict"

// This script is injected into the every page visited by the user
// and is executed on document_end after the DOM is ready.
// 
;(function lx_content(){
  // Listen to messages from the background script
  chrome.extension.onMessage.addListener(dispatchMessage)

  var restorePadding   // "0px" or similar
  var bodyPadding = {} // { top: "0px", ... }
  var body             // document body
  var notebookElement  // article element | undefined
  var edge             // "top" | "right" | "bottom" | "left"
  var edgeSizes        // { horizontal: "Xpx", vertical: "Ypx" }

  ;(function getInitialBodyPadding(){
    var style = window.getComputedStyle(document.body)
    restorePadding = style.padding

    bodyPadding.top = style.paddingTop
    bodyPadding.right = style.paddingRight
    bodyPadding.bottom = style.paddingBottom
    bodyPadding.left = style.paddingLeft
  })()

  function dispatchMessage(request, sender, callback) {
    var response = {}

    switch (request.method) {
      case "getNoteBookStatus":
        getNoteBookStatus(response)
      break
      case "openNoteBook":
        response.data = openNoteBook(request)
      break
      case "hideNoteBook":
        response.data = hideNoteBook(request)
      break
    }

    callback(response)
  }
  
  function getNoteBookStatus(response) {
    notebookElement = document.querySelector("#lx-notebook")
    // undefined | article element
    response.open = !!notebookElement
  }

  function openNoteBook(request) {
    // { placing: {
    //     edge: <top | right | bottom | left>
    //   , size: { 
    //       vertical: "Xpx"}
    //     , horizontal: "Ypx"
    //     }
    //   }
    // , html: html
    // }
    // notebookElement is falsy when this is called

    body = document.body
    edge = request.placing.edge
    edgeSizes = request.placing.edgeSizes

    notebookElement = document.createElement("div")
    notebookElement.innerHTML = request.html
    notebookElement = notebookElement.children[0]

    positionNoteBook()
    body.appendChild(notebookElement)

    initializeInteractions()
 
    return "openNoteBook complete"
  }

  function positionNoteBook() {
    var sides = ["top", "right", "bottom", "left"]
    var padding = ""
    var cssText = ""
    var size
    var className

    sides.forEach(function setPadding(side) {
      if (side === edge) {
        cssText += side+":0;"

        if (["top", "bottom"].indexOf(side) < 0) {
          className = "vertical"
          cssText += "width:"
        } else {
          cssText += "height:"
          className = "horizontal"
        }

        size = edgeSizes[className]
        cssText += size +";"

      } else {
        size = bodyPadding[side]
      }

      padding += size + " "
    })

    notebookElement.className = className
    notebookElement.style.cssText = cssText
    body.style.padding = padding.trim() // "0px 0px 0px 0px"
  }

  function hideNoteBook(request) {
    var body = document.body  
    var inset = document.querySelector("#inset")

    body.removeChild(inset)
    body.style.padding = request.padding

    return "hideNoteBook complete"
  }

  function initializeInteractions() {
  }
})()




  // function pasteSelection(event) {
  //   var query = {
  //     active:true
  //   , windowId: chrome.windows.WINDOW_ID_CURRENT
  //   }
    
  //   var text = ""
  //   var url = ""

  //   function getSelection(tab) {
  //     var id = tab[0].id
  //     var message = { method: "getSelection" }

  //     function callback(response) {  
  //       textArea.innerHTML = response.data
  //     }

  //     chrome.tabs.sendMessage(id, message, callback)
  //   }

  //   chrome.tabs.query(query, getSelection) 
  // }