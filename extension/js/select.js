// This script is injected into the current page
;(function (){
  chrome.extension.onMessage.addListener(treatMessage)

  function treatMessage(request, sender, callback) {
    var response = {}

    switch (request.method) {
      case "getSelection":
        response.data = window.getSelection().toString()
      break
      case "setEdge":
        response.data = setEdge(request)
      break
    }

    callback(response)
  }

  function setEdge(request) {    
    var body = document.body
    var inset = document.querySelector("#inset")
    var css = request.css
    // var unset = ["top", "left", "bottom", "right", "height", "width"]
    body.style.padding = request.padding

    if (!inset) {
      inset = document.createElement("h1")
      inset.id = "inset"
      inset.innerHTML = "NoteBook"
      body.appendChild(inset)
    }

    inset.removeAttribute("style")
    // unset.forEach(function (key) {
    //   inset.style.removeProperty(key)
    // })

    for (var key in css) {
      if (css.hasOwnProperty(key)) {
        inset.style[key] = css[key]
      }
    }

    return "Edge Set"
  }
})()