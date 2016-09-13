/**
 * This script creates a global Hack object containing methods that
 * can be used to work around problems that theoretically should not 
 * occur.
 */

var Hack

;(function hack(){
  "use strict"

  Hack = {
    /** http://stackoverflow.com/a/36806402/1927589 **/
    getCSSRule: function getCSSRule(ruleName) {
      ruleName = ruleName.toLowerCase();
      var result = null;
      var find = Array.prototype.find;

      find.call(document.styleSheets, styleSheet => {
        result = find.call(styleSheet.cssRules, cssRule => {
          return cssRule instanceof CSSStyleRule 
              && cssRule.selectorText.toLowerCase() == ruleName;
        });
        return result != null;
      });
      return result;
    }

    /**
     * 
     * ACTION: Removes the given property from the CSS rule identified
     *         by the given selector, then restores it after a delay
     * ISSUES: * Called by panel_modifyDOM in the panels script, when
     *           an iFrame is created. Without this hack, iFrames with
     *           a src of"https://www.wiktionary.org/" show an
     *           incorrect vertical offset although other remote
     *           URLs work well without the hack.
     *           FIXES:  Chrome up to and including 53.0.2785.101
     *           FIXED:  NOT YET
     *         * Called by openPanel in the panels script, to ensure
     *           that the icon for tabs that slide horizontally are
     *           correctly placed at the end of the slide
     *           FIXES:  Chrome up to and including 53.0.2785.101
     *           FIXED:  NOT YET
     * @param  {string}  selector CSS selector such as "div#myID p" to
     *                            identify a CSS style declaration
     * @param  {string}  property CSS property such as "position"
     * @param  {integer} delay    integer milliseconds after which the
     *                            property of the given CSS style
     *                            declaration will be restored.
     **/
  , tweakCSSDeclaration: function (options) {
      var rule = this.getCSSRule(options.selector)
      var property = options.property
      var style
        , value

      if (rule) {
        style = rule.style
        value = style.getPropertyValue(property)
        

        setTimeout(function remove() {
          style.removeProperty(property)

          setTimeout(function restore() {
            style.setProperty(property, value)
          }, options.delay||1)

        }, options.pause||0)
      }

    }

  , speak: function speak(message) {
      if (!this.utterance) {
        this.utterance = new SpeechSynthesisUtterance()
      }
      this.utterance.text = message
      window.speechSynthesis.speak(this.utterance)
      console.log(message)
    }
  }
})()