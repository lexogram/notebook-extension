"use strict"

;(function content(){

  var toolbar = {
    selectedText: ""
  , extensionIsActive: false
  , parser: new DOMParser()

  , initialize: function initialize() {
      chrome.runtime.sendMessage(
        { method: "getExtensionStatus" }
      , updateStatus
      )

      return this

      function updateStatus(result) {
        toolbar.extensionIsActive = result.extensionIsActive
        toolbar.checkSelection()
      }
    } 

  , insertToolbar: function insertToolbar(request) {
      // { method: "insertToolbar"
      // , html: <html string>
      // }
      
      var body = document.body
      var nodes = this.parseAsElements(request.html)
      appendToBody(nodes)
      body.classList.add("lxo-annotations")
      this.extensionIsActive = true

      var close = document.querySelector(".lxo-toolbar a.close")
      close.addEventListener("click", function () {
        toolbar.removeToolbar.call(toolbar)
      }, false)

      function appendToBody(nodes) {
        var node
        
        for (var ii = 0, total = nodes.length; ii < total; ii += 1) {
          node = nodes[0]
          body.appendChild(node)
          toolbar.ignore.push(node)
        }
      }
    }

  , parseAsElements: function parseAsElements(html) {
      var tempDoc = this.parser.parseFromString(html, "text/html")
      return tempDoc.body.childNodes
    }

  , removeToolbar:function removeToolbar() {
      if (!this.extensionIsActive) {
        return
      }

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