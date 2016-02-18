"use strict"

;(function background(lx){
  // Triggered when browser is launched or extension is reloded
  lx.speak(
    "background loaded" +
    (!!chrome.browserAction ? "" : " browserAction missing")
  )

  var tabTracker
  var notebook
  var manager

  chrome.browserAction.onClicked.addListener(useExtension)

  function useExtension() {
    var dependencies

    if (!manager) {
      manager = lx.getInstance("Manager")
      tabTracker = lx.getInstance("TabTracker")
      notebook = lx.getInstance("Notebook")

      dependencies = {
        manager: manager
      , tabTracker: tabTracker
      , notebook: notebook
      }

      manager.initialize(dependencies)
      tabTracker.initialize(dependencies)
      notebook.initialize(dependencies)
    }
  }
})(lexogram)