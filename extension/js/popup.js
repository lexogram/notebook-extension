;(function (){
document.addEventListener('DOMContentLoaded', contentLoaded, false)

  function contentLoaded() {
    var checkPageButton = document.querySelector('button');
    checkPageButton.addEventListener('click', buttonClicked, false)
  }

  function buttonClicked() {
    chrome.tabs.getSelected(null, function(tab) {
      console.log(tab.url)
    });
  }
})()