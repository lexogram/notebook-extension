"use strict"

;(function content(){

  var toolbar = {
    selectedText: ""
  , extensionIsActive: false
  // // CHANGE
  // , original: document.body.cloneNode(true)
  // , annotated: document.body
  // , mode: "annotated"
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
      appendToBody(request.html)
      body.classList.add("lxo-annotations")
      this.extensionIsActive = true

      var close = document.querySelector(".lxo-toolbar a.close")
      close.addEventListener("click", function () {
        toolbar.removeToolbar.call(toolbar)
      }, false)

      // // CHANGE
      // var toggleMode = document.querySelector(".lxo-toolbar button")
      // close.addEventListener("click", function () {
      //   toolbar.toggleMode.call(toolbar)
      // }, false)

      this.addSpansToWordsIn(document.body)
 
      function appendToBody(html) {
        // CHANGE
        var children = toolbar.parseAsElements(html)
        var total = children.length
        
        for (var ii = 0; ii < total; ii += 1) {
          body.appendChild(children[0])
        }
      }
    }

  // CHANGE
  , parseAsElements: function parseAsElements(html) {
      var tempDoc = this.parser.parseFromString(html, "text/html")
      return tempDoc.body.childNodes
    }

  // , toggleMode: function toggleMode(event) {
  //     var button = event.target
  //     button.innerHTML = "Show " + this.mode

  //     switch (this.mode) {
  //       case "annotated":
  //         document.body.replaceChild(this.original, document.body)
  //         this.mode = "original"
  //       break
  //       case "original":
  //         document.body.replaceChild(this.annotated, document.body)
  //         this.mode = "annotated"
  //       break
  //     }
  //   }

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