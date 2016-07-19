"use strict"

import { Meteor } from 'meteor/meteor';

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
  console.log('reading words.json')
  var fs = Npm.require('fs')
  // File is saved as public/data/words.json
  var path = process.cwd() + '/../web.browser/app/data/words.json'

  function fileReadCallback(error, data) {
    if (error) {
      console.log('Error: ' + error)
      return
    }

    wordFrequencies = JSON.parse(data)
    console.log(wordFrequencies["the"])
  } 

  fs.readFile(path, 'utf8', fileReadCallback)
}

function analyzeText(options) {
  // options = { data: <string> }

  var text = options.data
  if (typeof text !== "string") {
    return "String expected in analyzeText: " + options.data
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

  // Ignore unknown words and word fragments
  words = words.filter(function registeredWordsOnly(word) {
    return !!wordFrequencies[word]
  })

  words.sort(function byFrequency(word1, word2) {
    return wordFrequencies[word1].index > wordFrequencies[word2].index
  })

  // Add all filtered words to the output, only once each
  total = words.length  
  for (ii = 0; ii < total; ii += 1) {
    word = words[ii]
    if (treated.indexOf(word) < 0) {
      treated.push(word)

      wordData = wordFrequencies[word]
      data = { 
        word: word
      , index: wordData.index
      , count: wordData.count
      }

      output.push(data)
    }
  }

  return output
}
