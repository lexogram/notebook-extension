;(function cssWithJS(){
  var colors = ["#900", "#990", "#090", "#099", "#009", "#909"]

  
  function getCSSRule(ruleName) {
    ruleName = ruleName.toLowerCase();
    var result = null;
    var find = Array.prototype.find;

    find.call(document.styleSheets, getRuleIn)

    function getRuleIn(styleSheet) {
      var match
      result = find.call(styleSheet.cssRules, getMatchingRule)

      function getMatchingRule(cssRule) {
        var match = cssRule instanceof CSSStyleRule
        if (match) {
          match = cssRule.selectorText.toLowerCase() === ruleName
        }
        return match
      }
        
      match = !!result
      return match
    }

    return result
  }

  document.querySelector("button").onclick = function () {
    var rule = getCSSRule(".test")
    var color = colors.shift()
    var fontSize

    colors.push(color)
    rule.style.color = color

    if (rule.style["font-size"]) {
      rule.style.removeProperty("font-size")
    } else {
      fontSize = (6 + Math.floor(Math.random() * 30)) + "px"
      rule.style.setProperty("font-size", fontSize)
    }
  }
})()

/** http://stackoverflow.com/a/36806402/1927589 **/
// function getCSSRule(ruleName) {
//   ruleName = ruleName.toLowerCase();
//   var result = null;
//   var find = Array.prototype.find;

//   find.call(document.styleSheets, styleSheet => {
//     result = find.call(styleSheet.cssRules, cssRule => {
//       return cssRule instanceof CSSStyleRule 
//           && cssRule.selectorText.toLowerCase() == ruleName;
//     });
//     return result != null;
//   });
//   return result;
// }