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

  , initialize: function initialize() {
      // this.port = chrome.runtime.connect(extensionId, connectInfo)
      // this.port.onMessage.addListener(treatMessage)
      chrome.runtime.sendMessage(
        { method: "iFrameSetHeight"
        , height: "auto"
        }
      )

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
      var bodyRect = document.body.getBoundingClientRect()
      var anchorRect = element.getBoundingClientRect()

      request.scrollTop = anchorRect.top - bodyRect.top

      chrome.runtime.sendMessage( request )
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