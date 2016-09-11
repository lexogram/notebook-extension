"use strict"

var Session

;(function session(){

  Session = {
    map: {}

  , listeners: { _: [] }

  , get: function get (key) {
      return this.map[key]
    }

  , set: function set (key, value) {
      this.map[key] = value
      localStorage.setItem("session", JSON.stringify(this.map))
      this.broadcast(key)
      return value
    }

  , register: function register(listener, key) {
      var listeners

      if (!(listener instanceof Function)) {
        console.log("Expected function in Session.register", listener)
        return
      }

      if (key) {
        listeners = this.listeners[key]
        if (!listeners) {
          listeners = []
          this.listeners[key] = listeners
        }

        if (listeners.indexOf(listener) < 0) {
          listeners.push(listener)
        }

      } else if (this.listeners._.indexOf(listener) < 0) {
        this.listeners._.push(listener)
      }
    }

  , broadcast: function broadcast(key) {
      var value = this.map[key]
      var listeners = this.listeners._
      var total
      var ii

      for (ii = 0, total = listeners.length; ii<total; ii += 1) {
        listeners[ii](key, value)
      }

      listeners = this.listeners[key]
      if (listeners) {
        for (ii = 0, total = listeners.length; ii<total; ii += 1) {
          listeners[ii](key, value)
        }
      }
    }

  , initialize: function initialize() {
      try {
        this.map = JSON.parse(localStorage.getItem("session")) || {}
      } catch (error) {
        this.map = {}
      }
      return this
    }
  }.initialize()
})()