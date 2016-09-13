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

  var connections = {
    port: null

  , initialize: function initialize() {
      this.port = chrome.runtime.connect(extensionId)
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

  , tellBackground: function tellBackround(message) {
      this.port.postMessage(message)
    }

  , iFrameHeight: function iFrameHeight(message) {
      var domain = message.host.match(/[^.]\w+\.\w+$/)[0]
      var heights = Session.get("iFrameHeights")
      if (!heights) {
        heights = {}
      }

      heights[domain] = message.height

      Session.set("iFrameHeights", heights)
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
    if (typeof method === "function") {
      method.call(connections, request)
    }
  }

  function disableExtension() {
    treatMessage({ method: "disableExtension" })
  }

  window.onbeforeunload = disableExtension
})() // remove iife () when Meteor.startup() is restored