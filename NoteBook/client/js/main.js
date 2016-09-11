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
  var  extensionId = "klhekknnkamgbfeckfdnkbjeelddikck"
  // Use your own extension id ^

  var connections = {
    port: null
  , pSelection: document.getElementById("selection")
  , pTranslation: document.getElementById("translation")
  // , wiktionary: document.getElementById("wiktionary")
  // , wikiURL: ["https://"
  //   , ".wiktionary.org/w/index.php?title="
  //   , "&printable=no"
  //   ]
  // , word: ""

  , initialize: function initialize() {
      this.port = chrome.runtime.connect(extensionId)
      this.port.onMessage.addListener(treatMessage)

      // this.pSelection.onclick = function (event) {
      //   connections.selectWord.call(connections, event)
      // }

      tellBackground = function (message) {
        connections.tellBackground.call(connections, message)
      }

      return this
    }

  , changeSelection: function changeSelection(request) {
      var selection = request.data
      // this.word = selection.substr(0, selection.indexOf(" "))
      //          || selection
      this.pSelection.innerHTML = selection
      // Meteor.call("analyzeText", { data: selection }, updateTable)

      // function updateTable(error, data) {
      //   if (error) {

      //   } else {
      //     Session.set("rows", data)
      //   }
      // }
      
      //this.showInWikiTab()
    }

  // , selectWord: function selectWord(event) {
  //     var selection = window.getSelection()
  //     var range = selection.getRangeAt(0)
  //   }

  // , showInWikiTab: function showInWikiTab() {
  //     var code = Session.get("nativeCode")
  //     var urlArray = this.wikiURL

  //     if (!this.word) {
  //       return
  //     }
      
  //     var url = urlArray[0]+code+urlArray[1]+this.word+urlArray[2]
  //     //wiktionary.src = url
  //   }

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

  , tellBackground: function tellBackround(message) { // NEW
      this.port.postMessage(message)

      switch (message.method) {
        case "setLanguages":
          this.showInWikiTab()
        break
      }
    }

  , showGoogleTranslation: function showGoogleTranslation(request) {
      this.pTranslation.innerHTML = request.data
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