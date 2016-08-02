"use strict"

;(function content(){

  var toolbar = {
    selectedText: ""
  , extensionIsActive: false
  // CHANGE
  , ignore: []
  , mode: "annotations"
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

      this.extensionIsActive = true

      this.addSpansToTree(body)
 
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

      ;(function activateToolbarButtons() {
        var close = document.querySelector(".lxo-toolbar a.close")
        var toggleMode = document.querySelector(".lxo-toolbar button")

        close.addEventListener("click", function () {
          toolbar.removeToolbar.call(toolbar)
        }, false)

        // // CHANGE
        // toggleMode.addEventListener("click", function (event) {
        //   toolbar.toggleMode.call(toolbar, event)
        // }, false)
      })()
    }

  // // CHANGE
  , parseAsElements: function parseAsElements(html) {
      var tempDoc = this.parser.parseFromString(html, "text/html")
      return tempDoc.body.childNodes
    }

  // , toggleMode: function toggleMode(event) {
  //     var button = event.target
  //     var body = document.body
  //     var hash = window.location.hash
  //     button.textContent = "Show " + this.mode
 
  //     switch (this.mode) {
  //       case "original":
  //         this.addSpansToTree(body)
  //         this.mode = "annotations"
  //       break
  //       case "annotations":        
  //         this.removeSpansFromTree(body)
  //         this.mode = "original"
  //       break
  //     }

  //     if (hash) {
  //       // Force page to jump to current hash
  //       window.location.hash = ""
  //       window.location.hash = hash
  //   }

  , removeToolbar:function removeToolbar() {
      if (!this.extensionIsActive) {
        return
      }

      // // CHANGE
      // if (this.mode === "annotations") {
      //   this.removeSpansFromTree(document.body)
      // }

      var toolbar = document.querySelector("section.lxo-toolbar")
      toolbar.parentNode.removeChild(toolbar)
      document.body.classList.remove("lxo-annotations")

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
  , addSpansToTree: function addSpansToTree(element) {
      var childNodes = element.childNodes
      var ii = childNodes.length

      if (ii) {
        // Work backwards, because .childNodes is a live collection,
        // and so its length changes as new <span> nodes are added.
        while (ii--) {
          if (this.ignore.indexOf(element) < 0) {
            addSpansToTree.call(this, childNodes[ii])
          }
        }
      } else if (applicable(element)) {
        replaceWithWordSpans(element)
      }

      function applicable (element) {
        var applicable = element.nodeType !== 8 //not a <!--comment-->

        if (applicable) {
          applicable = element.tagName !== "SCRIPT"
        }

        return applicable
      }

      function replaceWithWordSpans(element) {
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

        while (result = toolbar.regex.exec(textContent)) {
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
          // <HACK:
          // Leading whitespace is ignored. Without this hack, there
          // would be no space between the end of an inline element,
          // such as a link, and the text that follows.
          htmlString = "<br/>" + htmlString
          // HACK>
          elements = toolbar.parseAsElements(htmlString)
          index = elements.length - 1

          parentNode = element.parentNode
          // Replace current text node with the last span ...      
          nextSibling = elements[index]
          parentNode.replaceChild(nextSibling, element)
          // ... then place the other elements in reverse order
          for (;index > 1;) { // Use > 1 because of earlier <HACK>
            index -=1
            element = elements[index]
            parentNode.insertBefore(element, nextSibling)         
            nextSibling = element
          }
        }
      }
    }

  // , removeSpansFromTree: function removeSpansFromTree(element) {
  //     var childNodes = element.childNodes 
  //     var ii = childNodes.length

  //     if (!ii) {
  //       return
  //     }

  //     var textArray = []
  //     var nodesToReplace = []
  //     var regex = /lxo-w\d/
  //     var treating = false
  //     var childNode
  //       , treat
  //       , isTextNode

  //     while (ii--) {
  //       childNode = childNodes[ii]
  //       isTextNode = childNode.nodeType === 3
  //       treat = (childNode.tagName === "SPAN"
  //        && regex.exec(childNode.className))

  //       if (treat || treating && isTextNode) {
  //         nodesToReplace.push(childNode)
  //         textArray.unshift(childNode.textContent)
  //         treating = true
  //       } else {
  //         if (treating) {
  //           treating = false
  //           replaceSpansWithTextContent()
  //         }

  //         this.removeSpansFromTree(childNode)
  //       }
  //     }

  //     if (treating) {
  //       replaceSpansWithTextContent()
  //     }

  //     function replaceSpansWithTextContent() {
  //       var ii = nodesToReplace.length
  //       if (ii) {
  //         var textNode = document.createTextNode(textArray.join(""))
          
  //         while (--ii) { // leaves last node in place for replaceChild
  //           element.removeChild(nodesToReplace.pop())
  //         }
          
  //         element.replaceChild(textNode, nodesToReplace.pop())
  //         textArray.length = 0
  //       }
  //     }
  //   }


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