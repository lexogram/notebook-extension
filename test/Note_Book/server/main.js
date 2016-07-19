"use strict"

import { Meteor } from 'meteor/meteor';

var wordFrequencies = {}

Meteor.startup(function () {
  readInWordsFile()
  defineMethods()
})

function readInWordsFile() {
  console.log('starting up Main.js')
  var fs = Npm.require('fs')
    // file originally saved as public/data/words.json
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

function defineMethods() {
  Meteor.methods({
    analyzeText: analyzeText
  })

  function analyzeText(options) {
    console.log("options", options)
    // { data: <string> }

    var text = options.data
    if (typeof text !== "string") {
      return "String expected in analyzeText: " + options.data
    }

    var words = text.split(/\W/)
    var output = []
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

    //console.log("lowercase", words)

    // Ignore unknown words or word fragments
    words = words.filter(function registeredWordsOnly(word) {
      return !!wordFrequencies[word]
    })

    //console.log("filtered", words)

    words.sort(function byFrequency(word1, word2) {
      return wordFrequencies[word1].index > wordFrequencies[word2].index
    })

    //console.log("sorted", words)
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
}