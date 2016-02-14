;(function (){
  document.addEventListener("DOMContentLoaded", contentLoaded, false)
  var textArea
    , p

  function contentLoaded() {
    var button = document.querySelector("button");
    button.addEventListener("click", pasteSelection, false)
    chrome.tabs.getSelected(null, getURL)

    textArea = document.querySelector("textarea")
    p = document.querySelector("p")
    //console.log("chrome.tabs.getSelected(null, getURL) called...")
  }

  function getURL(tab) {
    p.innerHTML = tab.url
  }

  function pasteSelection(event) {
    var query = {
      active:true
    , windowId: chrome.windows.WINDOW_ID_CURRENT
    }
    
    var text = ""
    var url = ""

    function getSelection(tab) {
      var id = tab[0].id
      var message = { method: "getSelection" }

      function callback(response) {  
        textArea.innerHTML = response.data
      }

      chrome.tabs.sendMessage(id, message, callback)
    }

    chrome.tabs.query(query, getSelection)
    
  }
})()