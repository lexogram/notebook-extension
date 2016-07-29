"use strict"

;(function content(){

  var toolbar = {
    selectedText: ""
  , extensionIsActive: false
  // CHANGE
  , original: null
  , annotated: document.body
  , ignore: []
  , mode: "annotated"
  , parser: new DOMParser()
  , regex: /(\w+)/g

  , initialize: function initialize() {
      chrome.runtime.sendMessage(
        { method: "getExtensionStatus" }
      , updateStatus
      )

      return this

      function updateStatus(result) {
        toolbar.extensionIsActive = result.extensionIsActive
      }
    } 

  , insertToolbar: function insertToolbar(request) {
      var body = document.body
      var nodes = this.parseAsElements(request.html)
      appendToBody(nodes)
      body.classList.add("lxo-annotations")

      this.original = body.cloneNode(true) // including toolbar

      activateToolbarButtons(body, "original")
      activateToolbarButtons(this.original, "annotations")

      this.extensionIsActive = true

      this.addSpansToWordsIn(body)
 
      function appendToBody(nodes) {
        // CHANGE
        var total = nodes.length
        var node
        
        for (var ii = 0; ii < total; ii += 1) {
          node = nodes[0]
          body.appendChild(node)
          toolbar.ignore.push(node)
        }
      }

      function activateToolbarButtons(element, mode) {
        var close = element.querySelector(".lxo-toolbar a.close")
        var toggleMode = element.querySelector(".lxo-toolbar button")

        close.addEventListener("click", function () {
          toolbar.removeToolbar.call(toolbar)
        }, false)

        // CHANGE
        toggleMode.addEventListener("click", function (event) {
          toolbar.toggleMode.call(toolbar, event)
        }, false)

        toggleMode.innerHTML = "Show " + mode
      }
    }

  // CHANGE
  , parseAsElements: function parseAsElements(html) {
      var tempDoc = this.parser.parseFromString(html, "text/html")
      return tempDoc.body.childNodes
    }

  , toggleMode: function toggleMode(event) {
      var button = event.target
      var body = document.body
      var hash = window.location.hash
      var scrollTopMap = getScrollTops() 
 
      switch (this.mode) {
        case "annotated":
          body.parentNode.replaceChild(this.original, body)
          this.mode = "original"
        break
        case "original":
          body.parentNode.replaceChild(this.annotated, body)
          this.mode = "annotated"
        break
      }

      if (hash) {
        // Force page to jump to current hash
        window.location.hash = ""
        window.location.hash = hash
      }

      setScrollTops()

      function getScrollTops() {

      }

      function setScrollTops() {

      }

      scrollTopMap
    }

  , removeToolbar:function removeToolbar() {
      if (!this.extensionIsActive) {
        return
      }

      // CHANGE
      document.body.replaceChild(this.original, document.body)

      chrome.runtime.sendMessage({ method: "forgetExtension" })

      this.extensionIsActive = false
    }

  , checkSelection: function checkSelection() {
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

  // CHANGE
  , addSpansToWordsIn: function addSpansToWordsIn(element) {
      if (this.ignore.indexOf(element) > -1) {
        return
      }

      var children = element.childNodes
      var ii = children.length

      if (ii) {
        // Work backwards, because .childNodes is a live collection,
        // and so its length increases as new <span> nodes are added.
        for (; ii > 0 ;) {
          ii -= 1
          this.addSpansToWordsIn(children[ii])
        }

      } else {
        this.replaceWithWordSpans(element)
      }
    }

  , replaceWithWordSpans: function replaceWithWordSpans(element) {
      if (element.nodeType === 8) {
        // This element is an <!-- HTML comment -->. Ignore it.
        return
      }

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

      while (result = this.regex.exec(textContent)) {
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
        elements = this.parseAsElements(htmlString)
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

  }.initialize()

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