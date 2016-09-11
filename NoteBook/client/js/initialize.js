"use strict"

;(function initialize(){
  var defaults = { 
    nativeCode: "en"
  , targetCode: "fr"
  }

  var key
  var value

  for (key in defaults) {
    if (!Session.get(key)) {
      Session.set(key, defaults[key])
    }
  }
})()