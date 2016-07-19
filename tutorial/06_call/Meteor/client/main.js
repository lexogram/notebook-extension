Meteor.startup(function() {
  var extensionId = "fjdkbjoegfbgmgdjjbaiakkimdamlloo"
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
  }

  port.onMessage.addListener(incoming)
})