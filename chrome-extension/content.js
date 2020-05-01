console.log("Bismillah Gooooo !!!");

document.addEventListener('mouseup', mouseup);

function mouseup() {
    let selected = window.getSelection().toString();
    console.log(selected);

    if(selected.length > 0) {
        let msg = {
            text : selected
        }

        chrome.runtime.sendMessage(msg);
    }

    document.execCommand("copy");
    
}