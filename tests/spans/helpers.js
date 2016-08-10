chrome.tabs.query({}
, function (tabs) {
  var data = {};
  tabs.forEach(function (tab) {
    data[tab.id] = tab.url
  }); 
  console.log(data);
})

chrome.tabs.get(
  73
, function (tab) {
    console.log(tab.url);
})