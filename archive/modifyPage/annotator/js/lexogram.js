 "use strict"

/** LEXOGRAM **
* Chrome-only version *
* 20160217
*
* This script runs first, (before or after jQuery and jQuery UI have
* been initialized). It creates a global lexogram object to store all
* lexogram-specific functions and data.
*
* As well as providing a centralized store of registered constructors
* and named instances, it is available for other objects to attach
* properties to the lexogram global "namespace".
*/

;(function lexogram(window){
 
  window.lexogram = {
  
    constructors: {}
 
  , instances: {}
  
  , data: {}
        
  , addConstructor: function addConstructor(constructor) {
     /* INPUT: <constructor> should be a function
      * ACTION: Adds a key/value entry to this.constructors, so that
      *         the constructor function can be identified by
      *         lexogram.constructors[<constructor name>]
      */
      
      var name = this.getConstructorName(constructor)
      if (name) {
        this.constructors[name] = constructor
      }
    }

  , getConstructorName: function getConstructorName(constructor) {
      var regex  = /^function\s*(\w+)/
      var result
      var name

      if (typeof constructor === "function") {
        result = regex.exec(constructor)
 
        if (result) {      // ["function Name", "Name"]
          name = result[1] //  "Name"
        }
      }

      return name // may be undefined
    }
   
  , getInstance: function getInstance(constructorName, options) {
     /* INPUT: <constructorName> should be the string name of a
      *         constructor function registered with addConstructor()
      *        <options> may be an object map. It may contain:
      *         - a name property, in which case a named instance of
      *           the constructor will be returned. Once it has been
      *           created, the same instance will always be returned
      *           in response to the same name
      *         - a singleton property, which may be a truthy value,
      *           in which case constructorName will be used as the
      *           name. Any subsequent requests for an instance of
      *           this constructor will always return the same
      *           singleton object, regardless of the name that is
      *           given, or whether singleton is specified.
      * NOTE:   If a named instance of a given constructor is
      *         requested first, and a singleton instance is requested
      *         later, the first (named) instance will continue to
      *         exist independently of the singleton.
      *           
      */
      
      var options = (typeof options === "object")
                  ? options
                  : {singleton: true}       
      var name
      var instance 
      var constructor
      
      if (options.singleton) {
        name = constructorName
      } else {
        name = options.name
      }

      instance = this.instances[constructorName] // previous singleton
      
      if (!instance) {
        if (name) {
          instance = this.instances[name]
        }
      }
      
      if (!instance) {
        constructor = this.constructors[constructorName]
        if (typeof constructor === "function") {
          var ancestor = options.ancestor
          if (typeof ancestor === "string") {
            ancestor = this.constructors[ancestor] // may now be a function
          }
          if (typeof ancestor === "function") {
            constructor.prototype = Object.create(ancestor.prototype)
            constructor.constructor = constructor
          }
          instance = new constructor(options)
    
          if (name) {
            this.instances[name] = instance
          }
        } else {
          console.log("Constructor expected: " + constructorName)
        }
      }
          
      return instance // may be undefined
    }
    
  , callInstance: function callInstance(constructorName, methodName, options) {
      var instance = this.getInstance(constructorName)
      if (instance && instance[methodName]) {
        instance[methodName](options)
      }
    }
    
  , removeInstance: function removeInstance(name) {
      delete this.instances[name]
    }

    /** Creates a property of the lexogram global object that can be
     *  addressed directly:
     *  var value = lexogram.<ModuleName>.<moduleMethod>()
     */
  , createModule: function createModule(constructor, options) {
      var name = this.getConstructorName(constructor)
      if (name) {
        if (Object.keys(this).indexOf(name) < 0) {
          this[name] = new constructor(options)
        }
      }
    }
    
    /**
     * @param {object} data object used to extend this.data
     */
  , addData: function addData(data) {
      function DataException() {
        this.message = message;
        this.name = "DataException";
      }
      
      try {
        if (typeof data === "object") {
          $.extend(this.data, data)          
        } else {
          throw new DataException("InvalidDataObject")
        }
      } catch(exception) {
        console.log(exception.name, exception.message)
      }
    }

  , speak:function speak(phrase) {
      console.log(phrase, (+ new Date()) % 100000)
      // var utterance = new SpeechSynthesisUtterance(phrase)
      // window.speechSynthesis.speak(utterance)
    }
  }
})(window)

//////// DEVELOPMENT UTILITY FUNCTIONS : DELETE FOR PRODUCTION //////

function getTabMap() {
  chrome.tabs.query({}, logTabMap)

  function logTabMap(tabs) {
    var data = {};
    tabs.forEach(function (tab) {
      data[tab.id] = tab.url
    }); 
    console.log(data);
  }
}

function getTabData(tabId) {
  chrome.tabs.get(tabId, logTabURL)
   
  function logTabURL(tab) {
      console.log(tab.url, tab);
  }
}