"use strict"

;(function manager(lx) {
 //lx.speak("manager")

  lx.addConstructor(Manager)

  function Manager () {
    //lx.speak("initializing manager")
  }

  Manager.prototype.initialize = function initialize(dependencies) {
    chrome.runtime.onMessage.addListener(tabToBase)
  }

  function tabToBase(a,b,c) {
    console.log(a,b,c)
    var a = 0
  }
})(lexogram)