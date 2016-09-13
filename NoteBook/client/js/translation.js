/** TRANSLATION ** 
 *
 * This script acts as the interface between the connections object,
 * which receives updates from the background script, and the 
 * p#selection and p#translation elements.
 */

;(function translation(){
  "use strict"

  var translation = {
    pSelection: document.getElementById("selection")
  , pTranslation: document.getElementById("translation")
  , pShowSource: document.getElementById("show-source")

    /**
     * SOURCE: Sent by Session.broadcast() following a call to 
     *         connection.changeSelection() received from the active
     *         content script via the background.
     * @param  {string} key       will be "selection"
     * @param  {string} selection will be the text selected in the 
     *                            active tab of the main window
     */
  , watchSelection: function watchSelection(key, selection) {
      if (selection) {
        this.pSelection.textContent = selection
      }
    }

    /**
     * SOURCE: Sent by Session.broadcast() following a call to 
     *         connection.showGoogleTranslation() received from the
     *         content script in the translate.google.com tab
     *         via the background.
     * @param  {string} key       will be "translation"
     * @param  {string} selection will be the text of the 
     *                            span#result_box in the google page
     */
  , watchTranslation: function watchTranslation(key, translation) {
      if (translation) {
        this.pTranslation.innerHTML = translation
        this.pShowSource.removeAttribute("disabled")
      }
    }

  , initialize: function initialize() {
      var self = this

      Session.register({
        method: function (key, value) {
          self.watchSelection.call(self, key, value)
        }
      , key: "selection"
      , immediate: false
      })

      Session.register({
        method: function (key, value) {
          self.watchTranslation.call(self, key, value)
        }
      , key: "translation"
      , immediate: false
      })
    }

  }.initialize()
})()