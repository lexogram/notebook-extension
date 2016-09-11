var scrollRandom

;(function (){
  var inner = document.getElementById("inner")
  var pArray = [].slice.call(inner.querySelectorAll("p"))
  var selection = getSelection()

  scrollRandom = function scrollRandom() {
    var p = pArray[Math.floor(Math.random() * pArray.length)]
    var text = p.textContent
    var words = text.split(/\b/)
    var index = Math.floor(Math.random() * words.length)
    var word = words[index]
    if (word.search(/\w/.exec(word)) < 0) {
      index = index ? index - 1 : index + 1
      word = words[index]
    }
    words = words.slice(0, index).join("")
    var startOffset = words.length
    var endOffset = startOffset + word.length

    var range = document.createRange()
    range.setStart(p.childNodes[0], startOffset)
    range.setEnd(p.childNodes[0], endOffset)

    selection.removeAllRanges()
    selection.addRange(range)

    console.log(word, startOffset, endOffset, words)

    scrollIntoView(range)
  }

  function scrollIntoView(range) {
    var rect = range.getBoundingClientRect()
    var parentNode = range.startContainer.parentNode
    scrollChildIntoView(parentNode, rect.top, rect.bottom)
  }

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


 ;( function repeat() {
    scrollRandom()
     setTimeout( repeat, 1000 )
  })()
})()

