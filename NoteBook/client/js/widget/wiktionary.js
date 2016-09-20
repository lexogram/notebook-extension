/** WIKTIONARY **
* 
* Custom script for showing the Wiktionary entry for the text selected
* in p#selection in a div#wiktionary iframe, if that panel is 
* currently active. If it is not active, the last request is stored
* locally and the call is made only when the panel is activated.
* 
*/


var Wiktionary

;(function wiktionary(){
  "use strict"

  Wiktionary = {
    panelId: "wiktionary"
  , wikiURL: ["https://"
    , ".wiktionary.org/w/index.php?title="
    , "&printable=no"
    ]
  , panel: 0
  , iFrame: 0
  , lastRequest: 0

  , initialize: function initialize() {
      var self = this

      Session.register({
        method: this.waitForStartUp
      , key: "ready"
      , scope: self
      , immediate: false
      })

      return this
    }

   , waitForStartUp: function(key, value) {
      var self = this
      this.panel = document.getElementById(this.panelId)

      Session.register({
        method: self.activate
      , key: "activePanel"
      , scope: self
      })
      Session.register({
        method: self.newSelection
      , key: "meaning"
      , scope: self
      })
      Session.register({
        method: self.setWidth
      , key: "iFrameWidth"
      , scope: self
      , immediate: false
      })
      Session.register({
        method: self.setHeight
      , key: "iFrameHeight"
      , scope: self
      , immediate: false
      })
      Session.register({
        method: self.setScrollTop
      , key: "iFrameScrollTop"
      , scope: self
      , immediate: false
      })
    }

    /*
    * Listener for when the wiktionary panel is activated
    * SOURCE: Called by Session.register() when this method is
    *         registered and Session.broadcast() following a call to
    *         Session.set("activePanel") in panelset toggleActive()
    * ACTION: If panelId is "wiktionary" and lastRequest is set,
    *         updates the src of the iFrame. 
    * @param  {string} key     will be "activePanel"
    * @param  {string} panelId may be "wiktionary", or any other value
    */
  , activate: function activate(key, panelId) {
      if (panelId !== this.panelId) {
        return
      }

      if (!this.iFrame) {
        this.iFrame = this.panel.querySelector("iframe")
      }

      if (this.iFrame && this.lastRequest) {
        this.updateFrame(this.lastRequest)
      }
    }

   /**
   * Listener for changes to Session.map.meaning
   * Session.set("meaning", { word: <string>, lang: <ISO code > }) is
   * called by requestMeaning() in selection.js
   * SOURCE: Sent by Session.broadcast()
   * ACTION: Updates the URL of the iframe#wiktionary
   * @param  {string} key  will be "meaning"
   * @param  {object} data should be an object map with the format
   *                       { word: <string>, lang: <ISO code string> }
   *                       data.lang is currently ignored
   */
 
  , newSelection: function newSelection(key, data) {
      OpenNoteBookPanel("wiktionary")

      if (data && data.text) {
        if (this.panel.classList.contains("active")) {
          this.updateFrame(data)
        } else {
          this.lastRequest = data
        }
      }
    }

   /**
   * SOURCE: Triggerd by newSelection() if the Wiktionary panel is
   *         active and by activate() if a prior request has been 
   *         saved
   * @param  {object} data will be an object map with the format
   *                       { word: <string>, lang: <ISO code string> }
   *                       data.lang is currently ignored
   */
  
  , updateFrame: function updateFrame(data) {
      var code = Session.get("nativeCode")
      var array = this.wikiURL  
      var url = array[0] + code + array[1] + data.text + array[2]

      if (this.iFrame) {
        this.iFrame.src = url
      } else {
        console.log("Wiktionary iframe not defined in newSelection")
      }
      
      this.lastRequest = undefined
    }

  , setWidth: function setWidth(key, value) {
      this.iFrame.style.minWidth = value
    }

  , setHeight: function setHeight(key, value) {
      this.iFrame.style.height = value
      this.iFrame.parentNode.scrollLeft = 160

      if (value === "auto") {
        tellBackground({ method: "iFrameSetHeight" })
        tellBackground({ 
          method: "iFrameGetScrollTop"
        , anchorId: Session.get("anchorId")
        })
      }
      // otherwise, wait for the window to resize before calling back
    }

  , setScrollTop: function setScrollTop(key, value) {
      this.iFrame.parentNode.scrollTop = value
    }

  , getOptions: function getOptions() {
      return {
        id: "wiktionary"
      , icon: "img/wiktionary.png" 
      , src: "https://www.wiktionary.org/"
      , init: function(panel) {
          Session.register({
            method: function getFrameHeight(key, value) {
              var height = value["wiktionary.org"]
              this.element.find("iframe").height(height)
              this.element.find("div")[0].scrollLeft = 160
            }
          , key: "iFrameHeights"
          , scope: panel
          , immediate: false
          })   
        }
      }
    }
  }.initialize()
})()