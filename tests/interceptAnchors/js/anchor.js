/** IFRAME **
 * 
 */

;(function (){
  "use strict"

  var wiktionary = {
    main: document.querySelector("main")

  , initialize: function initialize() {
       var self = this

      ;(function interceptAnchorLinks(){
        var links = document.links
        var ii = links.length
        var link
          , hasHash
          , id
        
        while (ii--) {
          link = links[ii]
          hasHash = link.href.split("#").length
          if (hasHash) {
            link.onclick = function (event) {
              self.iFrameScrollToAnchor.call(self, event)
            }
          }
        }
        
      })()

      return this
    }

  , iFrameScrollToAnchor: function iFrameScrollToAnchor(event) {
      event.preventDefault()
      var id = event.target.href.split("#")[1]
      var element = document.getElementById(id)
      var rect = element.getBoundingClientRect()
      var request = { 
        method: "iFrameScrollToAnchor"
      , scrollTop: rect.top
      }

      chrome_runtime_sendMessage( request )
    }

  }.initialize()

  function chrome_runtime_sendMessage(message) {
    treatMessage(message)
  }

  function treatMessage(request) {
    connections = {
      iFrameScrollToAnchor: function iFrameScrollToAnchor(request) {
        var main = document.querySelector("main")
        main.scrollTop += request.scrollTop
      }
    }

    var method = connections[request.method]
    if (method instanceof Function) {
      method.call(connections, request)
    }
  }
  }
})()