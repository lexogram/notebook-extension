;(function notebook(){

  function treatMessage(request, sender, sendResponse) {
    switch (request.method) {
      case "changeSelection":
        changeSelection(request.data)
      break
    }   
  }

  function changeSelection(selection) {
    document.getElementById("selection").innerHTML = selection
  }

  chrome.extension.onMessage.addListener(treatMessage)
  chrome.runtime.sendMessage({
    method: "registerNoteBookTabId"
  })
})()