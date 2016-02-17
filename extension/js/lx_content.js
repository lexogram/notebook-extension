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
  var edges = ["top", "right", "bottom", "left"]
  var edgeSizes        // { horizontal: "Xpx", vertical: "Ypx" }
  var selection 
  var selectedText = ""// text selected on main page

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

    if (callback) {
      callback(response)
    }
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
    body.appendChild(notebookElement)

    positionNoteBook()
    initializeInteractions()
 
    return "openNoteBook complete"
  }

  function positionNoteBook() {
    var padding = ""
    var cssText = ""
    var size
    var orientation

    edges.forEach(function setPadding(side) {
      if (side === edge) {
        cssText += side+":0;"

        if (["top", "bottom"].indexOf(side) < 0) {
          orientation = "vertical"
          cssText += "width:"
        } else {
          cssText += "height:"
          orientation = "horizontal"
        }

        size = edgeSizes[orientation]
        cssText += size +";"

      } else {
        size = bodyPadding[side]
      }

      padding += size + " "
    })

    notebookElement.className = edge
    notebookElement.style.cssText = cssText
    body.style.padding = padding.trim()

    showPosition()
  }

  function initializeInteractions() {
    var positionElement = document.querySelector("#lx-set-position")
    positionElement.addEventListener("click", setPosition, false)

    body.addEventListener("mouseup", checkSelection, false)
    body.addEventListener("keyup", checkSelection, false)
  }

  function setPosition(event) {
    var action = event.target.id.match(/lx-(\w+)/)
    var message

    if (!action) { return } else { action = action[1] }
    // top | right | bottom | left | close
    
    if (action === "close") {
      return closeNoteBook()
    } else if (edges.indexOf(action) < 0) {
      return // should never happen
    }

    edge = action
    positionNoteBook()

    message = { 
      method: "saveEdge"
    , edge: edge
    }
    chrome.runtime.sendMessage(message)
  }

  function showPosition() {
    var side
      , id
      , div

    for (var ii in edges) {
      side = edges[ii]
      id = "#lx-" + side
      div = document.querySelector(id)

      if (side === edge) {
        div.classList.add("selected")
      } else {       
        div.classList.remove("selected")
      }
    }
  }

  function closeNoteBook() {
    body.removeChild(notebookElement)
    body.style.padding = restorePadding

    body.removeEventListener("mouseup", checkSelection, false)
    body.removeEventListener("keyup", checkSelection, false)

    // TODO: break the connection with the server cleanly
  }

  function checkSelection(event) {
    selection = document.getSelection() // contains location data

    // Exclude any selection which starts or ends in the NoteBook
    var parent = selection.baseNode
    while (parent && (parent = parent.parentNode)) {
      if (parent === notebookElement) {       
        return
      }
    }
    parent = selection.extentNode
    while (parent && (parent = parent.parentNode)) {
      if (parent === notebookElement) {        
        return
      }
    }

    var text = selection.toString()
    if (selectedText !== text) {
      selectedText = text
    }

    document.querySelector("#lx-selection").innerHTML = selectedText
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