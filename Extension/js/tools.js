/** TOOLS **
 *
 * A number of useful methods
 */

var Tools

;(function (){
  "use strict"

  Tools = {
    addToArray: function addToArray(array, item) {
      var index = array.indexOf(item)
      if (index < 0) {
        return array.push(item)
      }
    }

  , deleteFromArray: function deleteFromArray(array, item) {
      var index = array.indexOf(item)
      if (index < 0) {
        // item is not in the array
      } else {
        return array.splice(index, 1)[0]
      }

    }

  , getMethodName: function getMethodName(method) {
      var methodName = "Not a function: "

      if (method instanceof Function) {
        methodName = /^function\s*(\w+)/.exec(method.toString())[1]
      } else {
        methodName += method
      }
      return methodName
    }

  , speak: function speak(message) {
      var utterance = new SpeechSynthesisUtterance(message)
      window.speechSynthesis.speak(utterance)
      console.log(message)
    }
  }
})()