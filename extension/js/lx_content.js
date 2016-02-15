"use strict"

// This script is injected into the current page and executed as soon
// as possible, before the DOM is ready
;(function (){
  chrome.extension.onMessage.addListener(dispatchMessage)

  function dispatchMessage(request, sender, callback) {
    var response = {}

    switch (request.method) {
      case "getPageData":
        response = getPageData()
      break
      case "showNoteBook":
        response.data = showNoteBook(request)
      break
      case "hideNoteBook":
        response.data = hideNoteBook(request)
      break
    }

    callback(response)
  }
  
  function getPageData() {
    var pageData = {}
    var style = window.getComputedStyle(document.body)
    var paddings = pageData.paddings = {}

    paddings.top = style.paddingTop
    paddings.right = style.paddingRight
    paddings.bottom = style.paddingBottom
    paddings.left = style.paddingLeft

    pageData.pageSize = {
      width: window.innerWidth
    , height:  window.innerHeight
    }

    return pageData
  }

  function showNoteBook(request) {
    var body = document.body
    var inset = document.querySelector("#inset")
    var css = request.css

    body.style.padding = request.padding // "0px 0px 0px 0px"

    if (!inset) {
      inset = document.createElement("h1")
      inset.id = "inset"
      inset.innerHTML = "NoteBook"
      body.appendChild(inset)
    }

    inset.removeAttribute("style")

    for (var key in css) {
      if (css.hasOwnProperty(key)) {
        inset.style[key] = css[key]
      }
    }

    return "showNoteBook complete"
  }

  function hideNoteBook(request) {
    var body = document.body  
    var inset = document.querySelector("#inset")

    body.removeChild(inset)
    body.style.padding = request.padding

    return "hideNoteBook complete"
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