;(function popup(){

  var popup = {
    initialize: function initialize() {
      self = this

      document.body.onchange = function(event) {
        self.inputValueChanged.call(self, event)
      }

      chrome.runtime.sendMessage(
        { method: "activateExtension"
        , async: true
        }
      , function setAutoActivate(response) {
          var always = document.getElementById("always")
          if ( response.autoActivate ) {
            always.setAttribute("checked", true)
          }
        }
      )

      return this
    }

  , inputValueChanged: function inputValueChanged(event) {
      var target = event.target
      var state = target.checked
      chrome.runtime.sendMessage({
        method: "state_changed"
      , key: target.id
      , value: target.checked
      })
    }
  }.initialize()


  function treatMessage(request, sender, sendResponse) {
    var method = popup[request.method]
    if (typeof method === "function") {
      method.call(popup, request, sender, sendResponse)
    }
  }
  
  chrome.runtime.onMessage.addListener(treatMessage)
})()