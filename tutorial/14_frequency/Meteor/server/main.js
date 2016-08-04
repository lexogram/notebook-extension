"use strict"

import { Meteor } from 'meteor/meteor'

var wordFrequencies = {}
var frequencyBands = (function getFrequencyBands(){
var bands = []
  // [                   46,   68,   100
  // , 147,  215,  316,  464,  681,  1000
  // , 1468, 2154, 3162, 4642, 6813, 10000]
  
  var rate = Math.log(100000)
  var chunks = 30
  var min = 10
  var ii = 15
  while(ii--) {
    bands[ii] = Math.round(Math.exp(rate / chunks * (ii + min)))
  }
  return bands
})()

Meteor.startup(function () {
  defineMethods()
  readInWordsFile()
})

function defineMethods() {
  Meteor.methods({
    analyzeText: analyzeText
  , getFrequencyData: getFrequencyData
  })
}

function readInWordsFile() {
  var fs = Npm.require('fs')
  var relative = '/../web.browser/app/data/words.json'
  var path = process.cwd() + relative

  function fileReadCallback(error, data) {
    if (error) {
      console.log('Error: ' + error)
      return
    }

    wordFrequencies = JSON.parse(data)
  } 

  fs.readFile(path, 'utf8', fileReadCallback)
}

function analyzeText(options) {
  // options = { data: <string> }
  var type = typeof options
  var text

  if (type !== "object" || options === null) {
    return "Object expected in analyzeText: " + type

  } else {
    text = options.data
    type = typeof text
    if (type !== "string") {
      return "String expected in analyzeText: " + type
    }
  }

  var words = text.split(/\W/)
  var output = []
  var treated = []
  var total
    , ii
    , word
    , wordData
    , count
    , data

  // Convert all words to lowercase
  words = words.map(function toLowerCase(word) {
    return word.toLowerCase()
  })

   // Remove unknown words, word fragments and duplicates while
  // retaining all numbers
  words = words.filter(function registeredWordsOnly(word, index) {
    return !!wordFrequencies[word] && words.indexOf(word) === index
  })

  words.sort(function byFrequency(word1, word2) {
    var result = -1
    if (wordFrequencies[word1].index > wordFrequencies[word2].index) {
      result = 1
    }

    return result
  })

  // Add all filtered words to the output
  total = words.length  
  for (ii = 0; ii < total; ii += 1) {
    word = words[ii]
    wordData = wordFrequencies[word]
    data = { 
      word: word
    , index: wordData.index
    , count: wordData.count
    }

    output.push(data)
  }

  return output
}

function getFrequencyData(options) {
  // options = { data: <string> }
  var type = typeof options
  var text

  if (type !== "object" || options === null) {
    return "Object expected in getFrequencyData: " + type

  } else {
    text = options.data
    type = typeof text
    if (type !== "string") {
      return "String expected in getFrequencyData: " + type
    }
  }

  var words = text.split(/\W/)
  var output = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
  var ii
    , word
    , data
    , band

  // Convert all words to lowercase
  words = words.map(function toLowerCase(word) {
    return word.toLowerCase()
  })

  // Remove unknown words, word fragments and duplicates while
  // retaining all numbers
  words = words.filter(function knownWordsAndNumbers(word, index) { 
    var isListed = !!wordFrequencies[word]
    var isNumber = /^\d+$/.test(word)
    var isFirstOccurrence = words.indexOf(word) === index
    return (isListed || isNumber) && isFirstOccurrence
  })

  // Add all filtered input to the appropriate band in the output
  ii = words.length  
  while(ii--) {
    word = words[ii]
    data = wordFrequencies[word] || { index: 0 } // for numbers
    band = getBand(data.index)

    output[band].push(word)
  }

  return output

  function getBand(index) {
     var band = 0
    frequencyBands.every(function(bandValue) {
      if (bandValue < index) {
        band += 1
        return true
      }
    })
    return band
  }
}