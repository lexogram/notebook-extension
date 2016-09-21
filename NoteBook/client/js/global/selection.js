/** SELECTION **
*
* Listens to a give selectionElement for changes to the selection 
* (through click-and-drag, double-click) and for when the left and
* right arrow keys are pressed. Selects hyphenated words whole.
*
* When a new selection is made, Session.set("meaning", data) is
* called, where data is an object map with the format:
* { text: <string>
* , lang: <ISO code string>
* }
*
* Listeners for dictionary panels such as div#wiktionary will update
* their panels as necessary.
* 
* NOTE: checkForAlteredTextNodes() and updateWordsMap() are intended
* for use with languages such as Thai where word boundaries are not
* defined by spaces. The placeholder ASYNC object should be replaced
* with an object that creates an asynchronous call to the server.
* See https://github.com/lexogram/notebook-extension/issues/8
*/

// Placeholder
var ASYNC = { 
  call: function(methodName) {
    var args = [].slice.call(arguments)
    args.shift()
    console.log("ASYNC " + methodName + "called:", args)
  }
}

function CustomSelection(selectionElement) {
  "use strict"
  
  var selection = window.getSelection()
  var _W = "\\s!-\\/:-@[-`{-~\\u00A0-¾—-⁊\\u200b"
  var startRegex = new RegExp("([^" + _W + "]+'?-?)+['-]$", "g")
  var endRegex = new RegExp("^['-]('?-?[^" + _W + "]+)+")
  var edgeRegex = new RegExp("[^" + _W + "]")
  var lastWordRegex = new RegExp("([^"+ _W +"])+", "g")
  var nextWordRegex = new RegExp(
    "([^"+ _W +"])*"
  + "(["+ _W +"])+"
  + "(?=[^"+ _W +"])"
  + "|^(?=[^" + _W + "])"
  )
  var wordStartRegex = new RegExp("[^" + _W + "]")
  var wordEndRegex = new RegExp("[" + _W + "]|$")

  var range
    , container
    , selectionUpdated

  var wordsCache = {}
  var wordsMap = { th: {} }
  var observer = new MutationObserver(checkForAlteredTextNodes)

  observer.observe(selectionElement, { 
    childList: true
  , attributes: true
  , subtree: true
  })

  selectionElement.onmouseup = treatSelection
  selectionElement.ondblclick = selectHyphenatedWords
  document.body.onkeydown = jumpToNextWord

  function selectHyphenatedWords(event) {
    if (!selection.rangeCount) {
      return
    }

    selectionUpdated = false
    range = selection.getRangeAt(0)
    container = range.startContainer
    var string = container.textContent
    var lang = getLang(container)

    switch (lang) {
      case "th":
      case "enx":
        selectByMap()
      break
      default:
        selectByRegex()
    }
  
    if (selectionUpdated) {
      selection.removeAllRanges()
      selection.addRange(range)
    }

    scrollIntoView(range)
    treatSelection()
    
    // NESTED FUNCTIONS //

    function selectByRegex() {
      if (string.substring(range.startOffset, range.endOffset)
                .search(edgeRegex) < 0) {
        // There are no word characters selected
        selectionUpdated = false
        return
      }

      extendSelectionBackBeforeHypen(string, range.startOffset)
      extendSelectionForwardAfterHyphen(string, range.endOffset)
    }

    function selectByMap() {
      var wordMap = wordsMap[lang]
      if (wordMap) {
        wordMap = wordMap[string]
      }

      if (typeof wordMap !== "object") {
        return console.log("No word map for ", string)
      }

      var wordEnds = wordMap.ends
      var wordStarts = wordMap.starts
      var offset = range.startOffset // same as range.endOffset
      var startOffset
        , endOffset
      var ii = wordEnds.length

      while (ii-- && !selectionUpdated) {
        if ((endOffset = wordEnds[ii]) < offset) {
          // The selection is not inside a word
          ii = 0
        } else {
          if ((startOffset = wordStarts[ii]) > offset) {             
          } else {
            range.setStart(container, startOffset)
            range.setEnd(container, endOffset)
            selectionUpdated = true
          }
        }
      }
    }
  }

  function extendSelectionBackBeforeHypen(string, offset) {
    var lastIndex = 0
    var result
      , index
    string = string.substring(0, offset)

    while (result = startRegex.exec(string)) {
      index = result.index
      lastIndex = startRegex.lastIndex
    }

    if (lastIndex === offset) {
      range.setStart(container, index)
      selectionUpdated = true
    }
  }

  function extendSelectionForwardAfterHyphen(string, offset) { 
    string = string.substring(offset)
    var result = endRegex.exec(string)

    if (result) {
      range.setEnd(container, offset + result[0].length)
      selectionUpdated = true
    }
  }

  function jumpToNextWord (event) {
    var rangeData

    if (!selection.rangeCount) {
      return
    } else if (!(range = selection.getRangeAt(0))) {
      return
    } else if (!selectionElement.contains(range.startContainer)) {
      return
    }

    switch (event.keyCode) {
      case 37: // Left
        rangeData = jumpLeft()
      break
      case 39: // Right
        rangeData = jumpRight()
    }

    if (!rangeData) {
      return
    }

    if (!selectionElement.contains(container)) {
      return
    }

    range.setStart(container, rangeData.startOffset)
    range.setEnd(container, rangeData.endOffset)

    switch (event.keyCode) {
      case 37: // Left
        extendSelectionBackBeforeHypen(
          rangeData.string
        , rangeData.startOffset
        )
      break
      case 39: // Right
        extendSelectionForwardAfterHyphen(
          rangeData.string
        , rangeData.endOffset
        )
      break
    }

    selection.removeAllRanges()
    selection.addRange(range)
    scrollIntoView(range)
    treatSelection()
  }

  function jumpLeft() {
    container = range.endContainer
    var lang = getLang(container)

    switch (lang) {
      case "th":
      case "enx":
        return jumpLeftByMap(container)
      default:
        return jumpLeftByRegex(container)
    }

    function jumpLeftByMap(container) {
      var string = container.textContent
      var wordMap = wordsMap[lang][string]
      if (typeof wordMap !== "object") {
        return console.log("No word map for ", string)
      }
      var wordEnds = wordMap.ends
      var wordStarts = wordMap.starts
      var endOffset = range.endOffset
                    + (range.startOffset === string.length)
      var startOffset
      var rangeData
      var result = setOffsets(endOffset)

      if (!result) {     
        container = getAdjacentTextNode(
          container
        , "previousSibling"
        , "pop"
        )

        if (container) {
          range = document.createRange()      
          range.setEnd(container, container.textContent.length)
          return jumpLeft()

        } else {
          // We're at the very beginning of the selectable text.
          // There's nothing earlier to select.
          return
        }
      }

      rangeData = {
        container: container
      , startOffset: startOffset
      , endOffset: endOffset
      , string: string
      }

      return rangeData

      function setOffsets(offset) {
        var ii = wordEnds.length

        while (ii--) {
          if ((endOffset = wordEnds[ii]) < offset) {
            startOffset = wordStarts[ii]
            ii = 0
          }
        }

        return (startOffset !== undefined)
      }
    }

    function jumpLeftByRegex(container) {
      var string = container.textContent
      var result = getPreviousWord(string, range.startOffset)
      var startOffset
        , endOffset
        , rangeData

      if (!result) {
        // There are no more words in this text node. Try the previous.
        container = getAdjacentTextNode(
          container
        , "previousSibling"
        , "pop"
        )

        if (container) {
          range = document.createRange()
          range.setEnd(container, container.textContent.length)
          return jumpLeft()

        } else {
          // We're at the very beginning of the selectable text. There's
          // nothing earlier to select.
          return
        }
      }

      startOffset = result.index
      endOffset = startOffset + result[0].length

      rangeData = {
        container: container
      , startOffset: startOffset
      , endOffset: endOffset
      , string: string
      }

      return rangeData

      function getPreviousWord(string, offset) {
        string = string.substring(0, offset)
        var result
          , temp

        while (temp = lastWordRegex.exec(string)) {
          result = temp
        }

        return result
      }
    }
  }

  function jumpRight() {
    container = range.startContainer
    var lang = getLang(container)

    switch (lang) {
      case "th":
      case "enx":
        return jumpRightByMap(container)
      default:
        return jumpRightByRegex(container)
    }

    function jumpRightByMap(container) {
      var string = container.textContent
      var wordMap = wordsMap[lang][string]
      if (typeof wordMap !== "object") {
        return console.log("No word map for ", string)
      }
      var wordEnds = wordMap.ends
      var wordStarts = wordMap.starts
      var startOffset = range.startOffset - (!range.endOffset)
      var endOffset
      var rangeData
      var result = setOffsets(startOffset)

      if (!result) {     
        container = getAdjacentTextNode(
          container
        , "nextSibling"
        , "shift"
        )

        if (container) {     
          range = document.createRange()
          range.setStart(container, 0)
          return jumpRight()

        } else {
          // We're at the very beginning of the selectable text.
          // There's nothing earlier to select.
          return
        }
      }

      rangeData = {
        container: container
      , startOffset: startOffset
      , endOffset: endOffset
      , string: string
      }

      return rangeData

      function setOffsets(offset) {
        var ii
        var length = wordStarts.length

        for (ii = 0; ii < length; ii += 1) {
          if ((startOffset = wordStarts[ii]) > offset) {
            endOffset = wordEnds[ii]
            ii = length
          }
        }

        return (endOffset !== undefined)
      }
    }

    function jumpRightByRegex(container) {
      var startOffset = range.endOffset
      var string = container.textContent
      var result = nextWordRegex.exec(string.substring(startOffset))
      var endOffset
        , rangeData

      if (result) {
        startOffset += result[0].length

      } else {
        // There are no more words in this text node. Try the next.
        container = getAdjacentTextNode(
          container
        , "nextSibling"
        , "shift"
        )

        if (container) {
          range = document.createRange()
          range.setStart(container, 0)
          return jumpRight()

        } else {
          // We're at the very end of the selectable text. There's
          // nothing more to select.
          return
        }
      }

      result = wordEndRegex.exec(string.substring(startOffset))
      endOffset = startOffset + result.index

      rangeData = {
        startOffset: startOffset
      , endOffset: endOffset
      , string: string
      }

      return rangeData
    }
  }

  function getAdjacentTextNode(node, whichSibling, arrayMethod) {
    // <whichSibling> will be "previousSibling" or "nextSibling"
    // <arrayMethod> will be "pop" or "shift"

    var parent = node.parentNode
    var adjacentNode

    while (node = node[whichSibling]) {
      if (node.textContent.search(/\S/) < 0) {         
      } else if (node.tagName !== "SCRIPT") {
        // The adjacent child of current parent has non-empty
        // content but it might not be selectable
        
        adjacentNode = getEndNode(node, arrayMethod)

        if (adjacentNode) {
          return adjacentNode
        }
      }
    } 

    // If we get here, there were no more sibling nodes. Try the 
    // adjacent sibling of the parent, unless we've reached the
    // farthest selectable child of the body itself 
    if (parent !== document.body) {
      return getAdjacentTextNode(parent, whichSibling, arrayMethod)
    }

    function getEndNode(node, arrayMethod) {
      var childNodes = [].slice.call(node.childNodes)

      if (!childNodes.length) {
        return node
      }

      while (node = childNodes[arrayMethod]()) {
        if (node.textContent.search(/\S/) < 0) {         
        } else if (node.tagName !== "SCRIPT") {
          if (node.nodeType === 3) {
            if (elementIsSelectable(node.parentNode)) {
              return node
            }
          } else {
            node = getEndNode(node, arrayMethod)
            if (node) {
              return node
            }
          }
        }
      }
    }
  }

  function scrollIntoView(node) {
    if (!node.getBoundingClientRect) {
      return
    }
    
    var rect = node.getBoundingClientRect()
    var parentNode = node.startContainer.parentNode
    scrollChildIntoView(parentNode, rect.top, rect.bottom)

    function scrollChildIntoView(parentNode, top, bottom) {
      var parentRect = parentNode.getBoundingClientRect()
      var topAdjust = parentRect.top - top
      var adjust = parentRect.bottom - bottom

      if (topAdjust > 0) {
        adjust = topAdjust
        parentNode.scrollTop -= adjust

      } else if (adjust < 0) {
        adjust = Math.max(adjust, topAdjust)
        parentNode.scrollTop -= adjust
      } else {
        adjust = 0
      }

      parentNode = parentNode.parentNode
      top += adjust
      bottom += adjust
      if (parentNode !== document.body) {
        scrollChildIntoView(parentNode, top, bottom)
      } else {
        scrollWindow(top, bottom)
      }
    }

    function scrollWindow(top, bottom) {
      var viewHeight = document.documentElement.clientHeight

      if (top < 0) {
        document.body.scrollTop += top
        document.documentElement.scrollTop += top
      } else if (bottom > viewHeight) {
        document.body.scrollTop += bottom - viewHeight
        document.documentElement.scrollTop += bottom
                                            - viewHeight
      }
    }
  }

  function getLang(node) {
    var lang = ""
    var element = node

    while (!element.closest) {
      element = element.parentNode
    }

    element = element.closest("[lang]")

    if (element) {
      lang = element.getAttribute("lang")
    }

    return lang
  }

  function elementIsSelectable(element) {
    var prefixes = [
      "-webkit-"
    , "-khtml-"
    , "-moz-"
    , "-ms-"
    , ""
    ]
    var style = window.getComputedStyle(element)

    var selectable = prefixes.every(function check(key) {
      key += "user-select"
      return style.getPropertyValue(key) !== "none"
    })

    return selectable
  }

  function checkForAlteredTextNodes(mutations) {
    var newTextMap = {} // { <lang>: [<string>, ...], ...}
    var newTextFound = false

    mutations.forEach(populateNewTextArray)
  
    if (newTextFound) {
      ASYNC.call("getWordSegmentation", newTextMap, updateWordsMap)
    }

    function populateNewTextArray(mutation) {
      var filter = {
        acceptNode: function(node) {
          var text = node.data
          var lang
            , map
            , langArray

          if (! /^\s*$/.test(text)) {
            lang = getLang(node)       
            if (map = wordsMap[lang]){
              if (elementIsSelectable(node.parentNode)) {
                if (!map[text]) {
                  if (!(langArray = newTextMap[lang])) {
                    langArray = []
                    newTextMap[lang] = langArray
                  }

                  langArray.push(text)
                  map[text] = true
                  newTextFound = true
                }
              }
            }
          }
        }
      }
      var walker = document.createTreeWalker(
        mutation.target
      , NodeFilter.SHOW_TEXT
      , filter
      )

      while (walker.nextNode()) {
        // Action occurs in filter.acceptNode       
      }      
    }
  }

  /**
   * updateWordsMap is triggered by a callback from the ASYNC call to
   * getWordSegmentation. For each language and each text key, it
   * replaces the existing `true` entry with the `offsets` array for
   * the word boundaries in the given string.
   * @param  {Error | null}  error   
   * @param  {null | object} result 
   *                         { <lang>: [
   *                              { "text": <string>
   *                              , "offsets": {
   *                                   "starts" <array of integers>
   *                                 , "ends" <array of integers>
   *                                 }
   *                               }
   *                             , ...
   *                             ]
   *                           , ...
   *                           }
   */
  function updateWordsMap(error, result) {
    if (error) {
      return console.log(error) // TODO
    }

    var lang
      , langArray
      , langMap
      , ii
      , textData

    for (lang in result) {
      langMap = wordsMap[lang]
      langArray = result[lang]

      ii = langArray.length
      while (ii--) {
        textData = langArray[ii]
        langMap[textData.text] = textData.offsets
      }
    }

    //console.log(JSON.stringify(wordsMap))
  }

  function treatSelection() {
    var word = selection.toString()
    var lang = getLang(selection.getRangeAt(0).startContainer)
    var data

    // Ignore word if it is all whitespace
    word = word.match(lastWordRegex)
    if (word) {
      Session.set("meaning", { text: word[0], lang: lang })
    }
  }
}