const fs = require("fs")
const wordBoundaries = / *[\.,;:!?"'()—–-]*(\n| |$)+/g
const matchDuplicateLines = /((.+)(\n|$))(\1)+/g
const replaceAsUniqueLine = "$1"
var frequencyArray

fs.readFile("frequency.txt", 'utf8', (err, data) => {
  if (err) {
    throw err
  }

  frequencyArray = data.split("\n")
  checkWordsIn("source.txt")
})

function checkWordsIn(source) {
  fs.readFile(source, 'utf8', (err, data) => {
    var max = 0
    var map = []
    var word
    var index
    var ii

    if (err) {
      throw err
    }

    data = data.replace(wordBoundaries, "\n").trim().toLowerCase()
    data = data.split("\n")
    data.sort()
    data = data.join("\n")

    data = data.replace(matchDuplicateLines, replaceAsUniqueLine)
    data = data.split("\n")

    for (ii in data) {
      word = data[ii]
      index = frequencyArray.indexOf(word)
      map.push({ word: word, index: index })

      if (index < 0) {
        console.log("Missing: ", word)
      } else if (max < index) {
        max = index
      }
    }

    map.sort(function (a, b) { return a.index - b.index })
    console.log(map);
  })
}