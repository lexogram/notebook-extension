// This script is injected into the current page
;(function (){
  chrome.extension.onMessage.addListener(treatMessage)

  function treatMessage(request, sender, callback) {
    var response = {}

    if (request.method == "getSelection") {
      response.data = window.getSelection().toString()
    }

    callback(response)
  }
})()