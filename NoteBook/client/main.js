// import { Template } from 'meteor/templating'
// Template.rows.helpers({
//   rows: function rows() {
//     return Session.get("rows")
//   }
// })

// import { Session } from 'meteor/session'

// Session.set("rows", [])
 
// Meteor.startup(function() {
  
;(function startUpWithoutMeteor(){
  var  extensionId = "klhekknnkamgbfeckfdnkbjeelddikck"
  // Use your own extension id ^

  var connections = {
    port: null
  , p: document.getElementById("selection")
  , wiktionary: document.getElementById("wiktionary")
  , wikiURL: ["https://en.wiktionary.org/w/index.php?title=", "&printable=no"]

  , initialize: function initialize() {
      this.port = chrome.runtime.connect(extensionId)
      this.port.onMessage.addListener(treatMessage)

      return this
    }

  , changeSelection: function changeSelection(request) {
      var selection = request.data
      this.p.innerHTML = selection
      // Meteor.call("analyzeText", { data: selection }, updateTable)

      // function updateTable(error, data) {
      //   if (error) {

      //   } else {
      //     Session.set("rows", data)
      //   }
      // }
      
      this.showInWikiTab(selection)
    }

  , showInWikiTab: function showInWikiTab(word) {
      var word = word.substr(0, word.indexOf(" ")) || word

      if (!word) {
        return
      }
      
      var url = this.wikiURL[0] + word + this.wikiURL[1]
      wiktionary.src = url
    }

  , getFrequencyData: function getFrequencyData(request) {
      // { method: "getFrequencyData"
      // , data: textContent
      // , id: <tab id where call originated> }
   // Meteor.call("getFrequencyData", request, treatFrequencyData)

      function treatFrequencyData(error, data) {
        if (error) {
          console.log("treatFrequencyData", error)

        } else {
          connections.port.postMessage({ 
            method: "treatFrequencyData"
          , data: data
          , id: request.id
          })
        }
      }
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