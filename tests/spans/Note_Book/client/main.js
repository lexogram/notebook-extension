import { Template } from 'meteor/templating' 

Session.set("rows", [])
 
Template.body.helpers({
  rows: function rows() {
    return Session.get("rows")
  }
});

Meteor.startup(function() {
  var extensionId = "dfhlekkdciiblbidbchopphkalomlblf"
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


  port.onMessage.addListener(incoming)
})