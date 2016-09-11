var fs = require("fs")

function getImage(url){
  return new Promise(function(resolve, reject){
    fs.exists(url, function(exists) {
      console.log("The path " + url + " exists: " + exists)
    })
    var img = new Image()

    img.onload = function(){
      resolve(url)
    }

    img.onerror = function(){
      reject(url)
    }

    img.src = url
  })
}

console.log(getImage("file:///Volumes/Yata/Downloads/baby-147416_960_720.png"))