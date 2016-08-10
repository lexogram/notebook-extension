"use strict"

// This script is injected into the every page visited by the user
// and is executed on document_end after the DOM is ready.

;(function lx_content(){
  // Listen to messages from the background script
  chrome.extension.onMessage.addListener(dispatchMessage)

  var body = document.body
  var original = body.cloneNode(true)

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
   
    var parser = new DOMParser() // used multiple times
    var injectedDOM = parseAsElements(request.html)

    var regex = request.languageMap.ru // <HARD-CODED for now>
    regex = new RegExp(regex[0], regex[1])

    addSpansToWordsIn(body)
    appendSectionToBody(injectedDOM)
    
    body.classList.add("lxo-annotator")

    return "showAnnotations complete"

    function parseAsElements(htmlString) {
      var tempDoc = parser.parseFromString(htmlString, "text/html")
      return tempDoc.body.childNodes
    }

    function addSpansToWordsIn(element) {
      var children = element.childNodes
      var ii = children.length

      if (ii) {
        // Work backwards, because .childNodes is a live collection,
        // and so its length increases as new <span> nodes are added.
        for (; ii > 0 ;) {
          ii -= 1
          addSpansToWordsIn(children[ii])
        }

      } else {
        replaceWithWordSpans(element)
      }
    }

    function replaceWithWordSpans(element) {
      //console.log(element, element.innerHTML, element.textContent)
      
      var textContent = element.textContent
      var altered = false
      var htmlString = ""
      var start = 0
      var odd = 0
      var end
        , word
        , result
        , className
        , elements
        , index
        , nextSibling
        , parentNode
        , div

      while (result = regex.exec(textContent)) {
        // [ 0: <word>
        // , 1: <word>
        // , index: <integer>
        // , input: string
        // , length: 2
        // ]
        altered = true

        end = result.index
        word = result[0]
        htmlString += textContent.substring(start, end)
        start = end + word.length
        className = "lxo-w" + (odd = (odd + 1) % 2 )
        htmlString += "<span class='"+className+"'>"+word+"</span>"
      }

      if (altered) {
        end = textContent.length
        htmlString += textContent.substring(start, end)

        // div = document.createElement("div")
        // div.innerHTML = htmlString
        // elements = div.childNodes
        elements = parseAsElements(htmlString)
        index = elements.length - 1

        parentNode = element.parentNode
        // Replace current text node with the last span ...      
        nextSibling = elements[index]
        parentNode.replaceChild(nextSibling, element)
        // ... then place the other elements in reverse order
        for (;index > 0;) {
          index -=1
          element = elements[index]
          parentNode.insertBefore(element, nextSibling)         
          nextSibling = element
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