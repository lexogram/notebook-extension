"use strict"

import { Meteor } from 'meteor/meteor'

var wordFrequencies = {}

Meteor.startup(function () {
  defineMethods()
  readInWordsFile()
})

function defineMethods() {
  Meteor.methods({
    analyzeText: analyzeText
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

  // Ignore unknown words, word fragments and duplicates
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