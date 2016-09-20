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
  
;(function startUpWithoutMeteor(){
  var extensionId = "klhekknnkamgbfeckfdnkbjeelddikck"
  // Use your own extension id ^
  var connectInfo = { name: "notebook" }

  var connections = {
    port: null

  , initialize: function initialize() {
      self = this
      this.port = chrome.runtime.connect(extensionId, connectInfo)
      this.port.onMessage.addListener(treatMessage)

      tellBackground = function (message) {
        self.tellBackground.call(self, message)
      }

      this.tellBackground({ method: "getStoredSettings" })

      return this
    }

  , tellBackground: function tellBackround(request) {
      this.port.postMessage(request)
    }

  , getStoredSettings: function (request) {
      Session.initialize(request.data)
    }

  , changeSelection: function changeSelection(request) {
      Session.set("selection", request.data)
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

  , showTranslation: function showTranslation(request) {
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
})() // remove iife () when Meteor.startup() is restored