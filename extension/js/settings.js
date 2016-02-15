"use strict"
var radio

;(function (){
  document.addEventListener("DOMContentLoaded", contentLoaded, false)

  // Data to show NoteBook positions and dimensions in settings.html
  var sizes = { // TODO: read custom settings from localStorage
    top: "300px"
  , right: "200px"
  , bottom: "300px"
  , left: "200px"
  }
  var position = localStorage.getItem("position") || "bottom"
  var paddings // as sizes, for padding of main page document.body
  var pageSize // { width: <integer>, height: <integer> }
  var toggle   // Show NoteBook button
  var padding  // "0px 0px 0px 0px" for body of main page
  var css      // { <css attribute>: <string value>, ... }

  /**
   * contentLoaded() is called each time the user clicks on the
   * extension button in the browser title bar, as the settings
   * window opens. If the window is resized (or indeed, clicked
   * anywhere), then the settings window will be closed. We can
   * therefore be sure that the main window size does not change
   * after setPageData is called.
   * @return {[type]} [description]
   */
  function contentLoaded() {
    var fieldset = document.querySelector("fieldset")
    fieldset.addEventListener("click", selectEdge, false)

    toggle = document.querySelector("#active")
    toggle.addEventListener("click", changeSettings, false)

    setPageData()
  }

  /** setPageData prepares the shape and size of the page image in
   *  the settings window, before it opens.
   */
  function setPageData() {
    var query = {
      active:true
    , windowId: chrome.windows.WINDOW_ID_CURRENT
    }

    function getPageData(tab) {
      var id = tab[0].id
      var message = { method: "getPageData" }

      function callback(response) { 
        paddings = response.paddings
        pageSize = response.pageSize
        // We now have the data needed for selecting the default edge
        // and showing the NoteBook
        selectEdge()
      }

      chrome.tabs.sendMessage(id, message, callback)
    }

    chrome.tabs.query(query, getPageData) 
  }

  /**
   * selectEdge sent by setPageData() when the extension is activated
   * and by a click on one of the edge elements. In the latter case
   * `event` will be truthy.
   * Sets the values for padding and css, depending on the current
   * position
   * @param  {undefined | MouseEvent} event
   */
  function selectEdge(event) {   
    var query = {
      active:true
    , windowId: chrome.windows.WINDOW_ID_CURRENT
    }
    var position = updatePosition(event)
    var edges = ["top", "right", "bottom", "left"]
    var size

    padding = ""  
    css = {
      color: "#003"
    , backgroundColor: "#eef"
    , position: "fixed"
    , margin: "0"
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

    changeSettings()
  }

  /** updatePosition sent by selectEdge()
   *  If `event` is a MouseEvent, updates the value of `position` in
   *  localStorage. Otherwise, ensures that the appropriate radio
   *  button is checked
   * @param  {undefined | MouseEvent} event
   * @return {string} "top" | "right" | "bottom" | "left"
   */
  function updatePosition(event) {
    var selector
    var radio

    if (event) {
      selector = 'input[name="edge"]:checked'
      radio = document.querySelector(selector)
      position = radio.value
      localStorage.setItem("position", position)
    } else {
      selector = 'input[name="edge"][value="' + position + '"]'
      radio = document.querySelector(selector)
      radio.checked = true
    }

    return position
  }

  /**
   * [changeSettings description]
   * @param  {undefined || MouseEvent} event will be falsy if the
   *         call came from selectEdge, in which case:
   *         - The NoteBook should be shown if it is not showing
   *         - The NoteBook should remain showing it is already is
   * Shows the NoteBook at the appropriate edge, or hides it
   */
  function changeSettings(event) {
    var query = {
      active:true
    , windowId: chrome.windows.WINDOW_ID_CURRENT
    }
    var message
    var checked = !event || toggle.checked

    toggle.checked = checked

    if (!checked) {
      message = { method: "hideNoteBook" }
      message.padding = paddings.top + " " + paddings.right + " "
                  + paddings.bottom + " " + paddings.left
    } else {
      message = { method: "showNoteBook", padding: padding, css: css }
    }

    /**
     * Callback from chrome.tabs.query() when the current tab has
     * been identified
     */
    function showNoteBook(tab) {
      var id = tab[0].id
  
      function callback(response) {  
        console.log(response.data)
      }

      chrome.tabs.sendMessage(id, message, callback)
    }

    chrome.tabs.query(query, showNoteBook) 
  }
})()