"use strict"

;(function background(lx){
  // Triggered when browser is launched or extension is reloaded
  // lx.speak(
  //   "background loaded" +
  //   (!!chrome.browserAction ? "" : " browserAction missing")
  // )

  var tabTracker
  var popup
  //var manager

  chrome.browserAction.onClicked.addListener(useExtension)

  function useExtension() {
    var dependencies

    if (!tabTracker) {
      //manager = lx.getInstance("Manager")
      tabTracker = lx.getInstance("TabTracker")
      popup = lx.getInstance("Popup")

      dependencies = {
        tabTracker: tabTracker
      //, manager: manager
      , popup: popup
      }

      //manager.initialize(dependencies)
      tabTracker.initialize(dependencies)
      popup.initialize(dependencies)
    }
  }
})(lexogram)