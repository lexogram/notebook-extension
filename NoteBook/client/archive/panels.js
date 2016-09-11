"use strict"

;(function panels(){
  var panels = document.getElementById("panels")
  panels.onclick = openPanel
  var icons = [].slice.call(panels.querySelectorAll(":scope>div>img"))
  panels = [].slice.call(panels.querySelectorAll(":scope > div"))

  function openPanel (event) {
    var target = event.target
    var active = false
    var activeClass = "active"
    if (icons.indexOf(target) < 0) {
      return
    }

    target = target.parentNode
    active = target.classList.contains(activeClass)
    for (var ii = 0, total = panels.length; ii < total; ii += 1) {
      panels[ii].classList.remove(activeClass)
    }
    if (!active) {
      target.classList.add(activeClass)
    }
  }
})()