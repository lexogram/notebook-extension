;(function (){
  document.addEventListener("DOMContentLoaded", contentLoaded, false)
  var sizes = { 
    top: "300px"
  , right: "200px"
  , bottom: "300px"
  , left: "400px"
  }
  var paddings = {}
  var body
    , textArea
    , p
    , paddings

  // use onClick(function( tabs.Tab tab) {...}) if no popup is used;

  function contentLoaded() {
    var button = document.querySelector("button")
    var form = document.querySelector("form")

    button.addEventListener("click", pasteSelection, false)
    form.addEventListener("click", setPosition, false)

    chrome.tabs.getSelected(null, getURL)

    body = document.body
    textArea = document.querySelector("textarea")
    p = document.querySelector("p")

    setBodyPaddings()
  }

  function setBodyPaddings() {
    var style = window.getComputedStyle(body)
    paddings.top = style.paddingTop
    paddings.right = style.paddingRight
    paddings.bottom = style.paddingBottom
    paddings.left = style.paddingLeft
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

  function setPosition(event) {    
    var query = {
      active:true
    , windowId: chrome.windows.WINDOW_ID_CURRENT
    }

    var radio = document.querySelector('input[name="edge"]:checked')
    var position = radio.value
    var padding = ""
    var edges = ["top", "right", "bottom", "left"]
    var css = {
      color: "#003"
    , backgroundColor: "#eef"
    , position: "fixed"
    , margin: "0"
    }
    var size

    function edgeSet(tab) {
      var id = tab[0].id
      var message = { method: "setEdge", padding: padding, css: css }

      function callback(response) {  
        console.log(response.data)
      }

      chrome.tabs.sendMessage(id, message, callback)
    }

    edges.forEach(function setPadding(edge) {
      if (edge === position) {
        size = sizes[edge]
        css[edge] = "0"

        if (["top", "bottom"].indexOf(edge) < 0) {
          css.width = size
          css.height = "100%"
          css.top = "0"  
        } else {
          css.height = size
          css.width = "100%"
          css.left = "0"       
        }
      } else {
        size = paddings[edge]
      }

      padding += size + " "
    })
    
    padding = padding.trim()

    chrome.tabs.query(query, edgeSet) 
  }
})()