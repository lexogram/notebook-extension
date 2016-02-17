"use strict"

;(function loaded(lx){
  // Triggered when browser is launched or extension is reloded
  lx.speak(
    "notebook loaded" +
    (!!chrome.browserAction ? "" : " browserAction missing")
  )

  var tabTracker

  var active_ids = []
  var active_id
  var baseToTab = chrome.tabs.sendMessage

  chrome.browserAction.onClicked.addListener(useExtension)
  chrome.runtime.onMessage.addListener(tabToBase)

  function useExtension() {
    tabTracker = lx.getInstance("TabTracker")
    tabTracker.initialize()

    // var getActiveTab = {
    //   active: true
    // , windowId: chrome.windows.WINDOW_ID_CURRENT
    // }
    // chrome.tabs.query(getActiveTab, saveTabID)

    // function saveTabID (tabs) {
    //   if (!tabs.length) {
    //     console.log("Tabs is empty if run from the debugger window.")
    //     return
    //   }
    //   active_id = tabs[0].id
    //   active_ids.push(active_id)

    //   var message = {
    //     method: "connect"
    //   }
    //   baseToTab(active_id, message, defaultCallback)
    // }
  }

  function tabToBase(a,b,c) {
    console.log(a,b,c)
    var a = 0
  }

  function defaultCallback(response) {
    console.log(response)
  }
})(lexogram)