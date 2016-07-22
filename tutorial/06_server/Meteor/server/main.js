"use strict"

import { Meteor } from 'meteor/meteor'

var wordFrequencies = {}

Meteor.startup(() => {
  readInWordsFile()
});

function readInWordsFile() {
  console.log('reading words.txt')
  var fs = Npm.require('fs')
  // File is saved as public/data/words.txt, and copied to ...
  // .meteor/local/build/programs/web.browser/app/data/words.txt 
  // ... when the app is compiled
  var path = process.cwd() + '/../web.browser/app/data/words.json'

  function fileReadCallback(error, data) {
    if (error) {
      console.log('Error: ' + error)
      return
    }

    try {
      wordFrequencies = JSON.parse(data)
      console.log(wordFrequencies["the"])
    } catch(err) {
      console.log("data is not in JSON format:", err)     
    }
  } 

  fs.readFile(path, 'utf8', fileReadCallback)
}
