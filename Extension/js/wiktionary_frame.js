/** IFRAME **
 * 
 */

;(function (){
  "use strict"

  var extensionId = "klhekknnkamgbfeckfdnkbjeelddikck"
  // Use your own extension id ^
  var connectInfo = { name: "wiktionary" }

  var wiktionary = {
    port: null

  , inIFrame: false 

  , initialize: function initialize() {
      var self = this
      
      this.inIFrame = (window.self !== window.top)
      if (!this.inIFrame) {
        return
      }

      chrome.runtime.sendMessage(
        { method: "iFrameSetHeight"
        , height: "auto"
        }
      )

      ;(function interceptAnchorLinks(){
        var url = window.location.href
        var path = window.location.pathName
        var search = window.location.search
        var links = document.links
        var ii = links.length
        var link
          , href
          , split
          , local
          , hasHash
          , id

        // url += path ? path : ""
        // url += search ? search : ""
        
        while (ii--) {
          link = links[ii]
          href = link.href
          split = href.split("#")
          local = split[0] === url

          if (local) {
            hasHash = split.length > 1
    
            if (local) {
              link.onclick = function (event) {
                self.iFrameScrollToAnchor.call(self, event)
              }
            }

          } else {
            link.onclick = function (event) {
              self.openInSeparateTab.call(self, event)
            }
          }
        }
      })()

      ;(function iFrameSetWidth(){
        var right = 0
        var width = document.body.style.width
        var treeWalker = document.createTreeWalker(
          document.body
        , NodeFilter.SHOW_ELEMENT
        )
        var element
          , rect

        document.body.style.width = "0"

        while (element = treeWalker.nextNode()) {
          rect = element.getBoundingClientRect()
          if (right < rect.right) {
            right = rect.right
          }
        }

        if (width) {
          document.body.style.width = width
        } else {
          document.body.style.removeProperty("width")
        }

        chrome.runtime.sendMessage(
          { method: "iFrameSetWidth"
          , width: right + 16 + "px" // <HACK: why is right wrong?>
          }
        )
      })()

      return this
    }

  , iFrameSetHeight: function iFrameSetHeight(response) {
      setTimeout(
        chrome.runtime.sendMessage(
          { method: "iFrameSetHeight"
          , height: document.body.scrollHeight + "px"
          }
        )
      , 100
      )
    }

  , iFrameGetScrollTop: function iFrameGetScrollTop(request) {
      var element = document.getElementById(request.anchorId)
      var anchorRect

      if (!element) {
        // There's no element with the given anchorId on this page
        return
      }

      anchorRect = element.getBoundingClientRect()
      request.scrollTop = anchorRect.top 

      chrome.runtime.sendMessage( request )
    }

  , iFrameScrollToAnchor: function iFrameScrollToAnchor(event) {
      event.preventDefault()
      var id = event.currentTarget.href.split("#")[1]
      var element = document.getElementById(id)
      var rect = element.getBoundingClientRect()
      var request = { 
        method: "iFrameGetScrollTop"
      , scrollTop: rect.top
      }

      chrome.runtime.sendMessage( request )
    }

  , openInSeparateTab: function openInSeparateTab(event) {
      event.preventDefault()
      var href = event.currentTarget.href
      window.open(href, "lxo")
    }
  }.initialize()

  function treatMessage(request) {
    var method = wiktionary[request.method]
    if (method instanceof Function) {
      method.call(wiktionary, request)
    }
  }

  chrome.extension.onMessage.addListener(treatMessage)
})()