
console.log('Bismillah Gooooo!!!!!');

chrome.runtime.onMessage.addListener(receiver);

window.word = "Jim";
function receiver(request, sender,  sendResponse) {
    console.log(request);
    window.word = request.text;
}