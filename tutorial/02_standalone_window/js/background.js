"use strict"

// Triggered when browser is launched or extension is reloaded
;(function background(){

  alert ("Background script loaded")

  chrome.browserAction.onClicked.addListener(useExtension)

  function useExtension() {
    alert ("useExtension triggered")

    // <HARD-CODED>
    var URL = chrome.extension.getURL("html/popup.html")
    var width = 300
    var top = 0
    // </HARD-CODED>

    var options = {
      url: URL
    , left: screen.availWidth - width
    , top: top
    , width: width
    , height: screen.availHeight - top
    , focused: false
    , type: "popup"//"normal"|"detached_panel"|"panel"//<experimental
    }

    chrome.windows.create(options, callback)

    function callback(window_data) {
      alert ("window opened", window_data)
    }
  }
})()