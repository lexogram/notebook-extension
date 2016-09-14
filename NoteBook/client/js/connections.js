// import { Template } from 'meteor/templating'
// Template.rows.helpers({
//   rows: function rows() {
//     return Session.get("rows")
//   }
// })

// import { Session } from 'meteor/session'

// Session.set("rows", [])
 
// Meteor.startup(function() {



var tellBackground
var iFrameGetScrollTop
  
;(function startUpWithoutMeteor(){
  var extensionId = "klhekknnkamgbfeckfdnkbjeelddikck"
  // Use your own extension id ^
  var connectInfo = { name: "notebook" }

  var connections = {
    port: null

  , initialize: function initialize() {
      this.port = chrome.runtime.connect(extensionId, connectInfo)
      this.port.onMessage.addListener(treatMessage)

      tellBackground = function (message) {
        connections.tellBackground.call(connections, message)
      }

      this.tellBackgroundOfInitialSettings()

      return this
    }

  , tellBackgroundOfInitialSettings: function () {
      this.tellBackground({
        method: "setLanguages"
      , nativeCode: Session.get("nativeCode")
      , targetCode: Session.get("targetCode")
      })
    }

  , changeSelection: function changeSelection(request) {
      Session.set("selection", request.data)
    }

  , tellBackground: function tellBackround(request) {
      this.port.postMessage(request)
    }

  , iFrameSetWidth: function iFrameSetWidth(request) {
      Session.set("iFrameWidth", request.width)
    }

  , iFrameSetHeight: function iFrameSetHeight(request) {
      Session.set("iFrameHeight", request.height)
    }

  , iFrameGetScrollTop: function iFrameGetScrollTop(request) {
      Session.set("iFrameScrollTop", request.scrollTop)
    }

  , showGoogleTranslation: function showGoogleTranslation(request) {
      Session.set("translation", request.data)
    }

  , disableExtension: function disableExtension() {
      if (this.port) {
        this.port.postMessage({ method: "disableExtension" })
        this.port = null
      }
    }
  }.initialize()

  // LISTENERS //LISTENERS //LISTENERS //LISTENERS //LISTENERS //

  function treatMessage(request) {
    var method = connections[request.method]
    if (method instanceof Function) {
      method.call(connections, request)
    }
  }

  function disableExtension() {
    treatMessage({ method: "disableExtension" })
  }

  window.onbeforeunload = disableExtension

  iFrameGetScrollTop = function (anchorId) {
  connections.iFrameGetScrollTop({
    method: "iFrameGetScrollTop"
  , anchorId: anchorId
  })
}
})() // remove iife () when Meteor.startup() is restored