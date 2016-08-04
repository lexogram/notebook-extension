import { Template } from 'meteor/templating'
import { Session } from 'meteor/session'

Session.set("rows", [])
 
Template.rows.helpers({
  rows: function rows() {
    return Session.get("rows")
  }
})

Meteor.startup(function() {
  var extensionId = "mnajpobcenajnokpgmcbnfjdlgfjejnn"
  // Use your own extension id ^
  var port = chrome.runtime.connect(extensionId)
  var p = document.getElementById("selection")

  function incoming(request) {
    switch (request.method) {
      case "changeSelection":
        changeSelection(request.data)
      break
    } 
  }

  function changeSelection(selection) {
    p.innerHTML = selection
    Meteor.call("analyzeText", { data: selection }, updateTable)
  }

  function updateTable(error, data) {
    if (error) {

    } else {
      Session.set("rows", data)
    }
  }

  function disableExtension() {
    port.postMessage({ method: "disableExtension" })
  }

  window.onbeforeunload = disableExtension
  port.onMessage.addListener(incoming)
})