/**
 * Proof of concept: read in a list of word frequencies and a text
 * file, and output the words used in the text file and their
 * index of frequency.
 */

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

    // Put words in alphabetical order, each on a separate line
    data = data.replace(wordBoundaries, "\n").trim().toLowerCase()
    data = data.split("\n")
    data.sort()
    data = data.join("\n")

    // Remove duplicates, to leave a list of distince words
    data = data.replace(matchDuplicateLines, replaceAsUniqueLine)
    data = data.split("\n")

    // Create an array of words:
    //  [ { word: <string>, index: <integer> }, ... ]
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

    map.sort((a, b) => { return a.index - b.index })
    console.log(map);
  })
}