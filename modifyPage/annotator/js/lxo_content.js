"use strict"

// This script is injected into the every page visited by the user
// and is executed on document_end after the DOM is ready.

;(function lx_content(){
  // Listen to messages from the background script
  chrome.extension.onMessage.addListener(dispatchMessage)

  var restorePadding   // "0px" or similar
  var body = document.body

  // ;(function registerLXOElements(){
  //   var lxoProto = Object.create(HTMLElement.prototype)
  //   var prefix = "lxo-"
  //   var customTypes = ["toolbar", "annotations"]

  //   var total = customTypes.length
  //   var ii
    
  //   for (ii = 0; ii < total; ii += 1) {
  //     document.registerElement(
  //       prefix + customTypes[ii]
  //     , { prototype: lxoProto }
  //     )
  //   }
    
  // })()

  ;(function getInitialBodyPadding(){
    var style = window.getComputedStyle(document.body)
    restorePadding = style.padding // used by closeNotebook()
  })()

  function dispatchMessage(request, sender, callback) {
    var response = {}

    switch (request.method) {
      case "showAnnotations":
        response.data = showAnnotations(request)
      break
      case "getLanguages":
       response.data = getLanguages()
      break
    }

    if (callback) {
      callback(response)
    }
  }

  function showAnnotations(request) {
    // { method: "showAnnotations"
    // , html: <html>
    // }
   
    var parser = new DOMParser()
    var tempDoc = parser.parseFromString(request.html, "text/html")
    var section = tempDoc.querySelector("section.lxo-content")

    duplicateBodyTo(section)
    appendSectionToBody(tempDoc.body.children)
    
    body.classList.add("lxo-annotator")

    return "showAnnotations complete"

    function duplicateBodyTo(section) {
      var elements = body.childNodes
      var total = elements.length
      var ii
        , element
      
      for (ii = 0; ii < total; ii += 1) {
        element = elements[ii].cloneNode(true)
        addSpansToWordsIn(element)
        section.appendChild(element)
      }
    }

    function addSpansToWordsIn(element) {
      var children = element.childNodes
      var total = children.length

      if (total) {
        var ii
          , element
      
        for (ii = 0; ii < total; ii += 1) {
          element = children[ii].cloneNode(true)
          addSpansToWordsIn(element)
        }

      } else {
        var words = element.innerHTML
        if (words) {

        }

      }
    }

    function appendSectionToBody(children) {
      var total = children.length
      var ii
      
      for (ii = 0; ii < total; ii += 1) {
        body.appendChild(children[0])
      }
    }
  }

  function getLanguages() {
    var languages = []
    var langElements = document.querySelectorAll("[lang]")
    var total = langElements.length
    var ii
      , langElement
      , language
    
    for (ii = 0; ii < total; ii += 1) {
      language = langElements[ii].getAttribute("lang").toLowerCase()
      if (languages.indexOf(language) < 0) {
        languages.push(language)
      }
    }

    return languages
  }
})()