"use strict"

;(function content(){

  var content = {
    selectedText: ""
  , extensionIsActive: false
  , parser: new DOMParser()
  , ignore: []
  , regex: /(\w+)/g
  , removex: /lxo-w\d+/
  , mode: "original"
  , frequencyMap: {}
  , translationSpan: null
  , googleActivated: false

  , initialize: function initialize() {
      chrome.runtime.sendMessage(
        { method: "getExtensionStatus" }
      , updateStatus
      )

      return this

      function updateStatus(result) {
        content.extensionIsActive = result.extensionIsActive
      }
    } 

  // , insertToolbar: function insertToolbar(request) {
  //     var body = document.body
  //     var nodes = this.parseAsElements(request.html)
  //     appendToBody(nodes)
  //     body.classList.add("lxo-annotations")

  //     this.populateFrequencyMap()
  //     this.extensionIsActive = true
  //     this.mode = "annotations"

  //     //this.addSpansToTree(body)
 
  //     function appendToBody(nodes) {
  //       var node
        
  //       for (var ii = 0, total = nodes.length; ii < total; ii += 1) {
  //         node = nodes[0]
  //         body.appendChild(node)
  //         content.ignore.push(node)
  //       }
  //     }

  //     ;(function activateToolbarButtons() {
  //       var close = document.querySelector(".lxo-toolbar a.close")
  //       var toggleMode = document.querySelector(".lxo-toolbar button")

  //       close.addEventListener("click", function () {
  //         content.removeToolbar.call(content)
  //       }, false)

  //       // CHANGE
  //       toggleMode.removeAttribute("disabled")
  //       toggleMode.addEventListener("click", function (event) {
  //         content.toggleMode.call(content, event)
  //       }, false)
  //     })()
  //   }
  // 
  // , toggleMode: function toggleMode(event) {
  //     var button = event.target
  //     var body = document.body
  //     var hash = window.location.hash
  //     button.textContent = "Show " + this.mode
  //
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
  //   }

  , parseAsElements: function parseAsElements(html) {
      var tempDoc = this.parser.parseFromString(html, "text/html")
      return tempDoc.body.childNodes
    }

  , closeExtension: function closeExtension() {
      if (!this.extensionIsActive) {
        return
      }

      // CHANGE
      if (this.mode === "annotations") {
        this.removeSpansFromTree(document.body)
      }

      document.body.classList.remove("lxo-annotations")

      chrome.runtime.sendMessage({ method: "forgetExtension" })

      this.extensionIsActive = false
    }

  // , removeToolbar:function removeToolbar() {
  //     if (!this.extensionIsActive) {
  //       return
  //     }

  //     // CHANGE
  //     if (this.mode === "annotations") {
  //       this.removeSpansFromTree(document.body)
  //     }

  //     var toolbar = document.querySelector("section.lxo-toolbar")
  //     toolbar.parentNode.removeChild(toolbar)
  //     document.body.classList.remove("lxo-annotations")

  //     chrome.runtime.sendMessage({ method: "forgetExtension" })

  //     this.extensionIsActive = false
  //   }

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

    // TEXT COLOURATION // TEXT COLOURATION // TEXT COLOURATION //

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

        while (result = content.regex.exec(textContent)) {
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
          className = content.frequencyMap[word.toLowerCase()]
                   || "lxo-w15"
          //className = "lxo-w" + (odd = (odd + 1) % 2 )
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
          elements = content.parseAsElements(htmlString)
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

  , removeSpansFromTree: function removeSpansFromTree(element) {
      var childNodes = element.childNodes 
      var ii = childNodes.length

      if (!ii) {
        return
      }

      var textArray = []
      var nodesToReplace = []
      var treating = false
      var childNode
        , treat
        , isTextNode

      while (ii--) {
        childNode = childNodes[ii]
        isTextNode = childNode.nodeType === 3
        treat = (childNode.tagName === "SPAN"
         && this.removex.exec(childNode.className))

        if (treat || treating && isTextNode) {
          nodesToReplace.push(childNode)
          textArray.unshift(childNode.textContent)
          treating = true
        } else {
          if (treating) {
            treating = false
            replaceSpansWithTextContent()
          }

          this.removeSpansFromTree(childNode)
        }
      }

      if (treating) {
        replaceSpansWithTextContent()
      }

      function replaceSpansWithTextContent() {
        var ii = nodesToReplace.length
        if (ii) {
          var textNode = document.createTextNode(textArray.join(""))
          
          while (--ii) { // leaves last node in place for replaceChild
            element.removeChild(nodesToReplace.pop())
          }
          
          element.replaceChild(textNode, nodesToReplace.pop())
          textArray.length = 0
        }
      }
    }

  , populateFrequencyMap: function populateFrequencyMap() {
      var textContent = document.body.textContent

      chrome.runtime.sendMessage(
        { method: "getFrequencyData"
        , data: textContent }
      )    
    }   

  , treatFrequencyData: function treatFrequencyData(request) {     
      // { method: "treatFrequencyData"
      // , data: <array of word frequencies>
      // , id: <id of this tab> }

      var frequencyMap = this.frequencyMap
      process(request.data)

      //console.log(this.frequencyMap)

      if (this.mode === "annotations") {
        this.addSpansToTree(document.body)
      }

      function process(frequencyData) {
        var total = frequencyData.length
        var array
          , className
          , index

        for (var ii = 0, total; ii < total; ii += 1) {
          array = frequencyData[ii]
          index = array.length
          className = "lxo-w" + ii

          while (index--) {
            frequencyMap[array[index]] = className
          }
        }
      }
    }

    // GOOGLE // GOOGLE // GOOGLE // GOOGLE // GOOGLE // GOOGLE //
  
    /**
     * SOURCE: Sent by activateGooglePage() in background.js, itself
     *         called by openConnection when the Google tab opens
     * ACTION: Detects the HTML element in the translate.google.com
     *         page, and sets up a listener for changes to the text
     *         of this element, in order to send the latest updates
     *         to p#translation in the NoteBook window.
     *         Google's translation streams in packet by packet, so
     *         debounce() is used to wait until it has (almost) all
     *         arrived.
     * @param  {[type]} request      [description]
     * @param  {[type]} sender       [description]
     * @param  {[type]} sendResponse [description]
     */
  , activateTranslationSpan: function activateTranslationSpan(request, sender, sendResponse) {
      sendResponse(true)
      var translationSpan
      var debounceDelay = 10
      var timeOut

      if (!content.googleActivated) {
        setTranslationSpan()
      }
      
      function setTranslationSpan(){
        translationSpan = document.getElementById("result_box")
        translationSpan.removeEventListener(
          "DOMSubtreeModified"
        , debounceTranslation
        , false
        )

        translationSpan.addEventListener(
          "DOMSubtreeModified"
        , debounceTranslation
        , false
        )

        content.googleActivated = true

        debounceTranslation()
      }

      function debounceTranslation () {
        if (timeOut) {
          clearTimeout(timeOut)
        }
        timeOut = setTimeout(sendTranslation, debounceDelay)
      }

      function sendTranslation() {
        timeOut = 0

        chrome.runtime.sendMessage({ 
          method: "showTranslation"
        , data: result_box.innerHTML
        })
      }
    }

  }.initialize()

  // LISTENERS // LISTENERS // LISTENERS // LISTENERS // LISTENERS // 

  function checkSelection(event) {
    content.checkSelection.call(content)
  }

  document.body.addEventListener("mouseup", checkSelection, false)
  document.body.addEventListener("keyup", checkSelection, false)

  function treatMessage(request, sender, sendResponse) {
    var method = content[request.method]

    if (typeof method === "function") {
      method.call(content, request, sender, sendResponse)
    }

    if (request.async) {
      return true
    }
  }

  chrome.extension.onMessage.addListener(treatMessage)
})()