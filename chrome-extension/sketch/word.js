var p = document.getElementById("damn");
var b = chrome.extension.getBackgroundPage();
p.innerHTML = b.word;