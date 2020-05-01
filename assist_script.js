function checkFirstTime() {
    let h = localStorage.getItem('_first-time');
    //console.log(h);

    if(h == null || h == 0) {
        let div = document.getElementById('allow');
        div.style.right = 0
        localStorage.setItem('_first-time', 1);
    }
}

if (annyang) {
    
    var commands = {
        'hello': function () { console.log('hello'); },
        'google *tag': google,
        'find *tag': google,
        'search *tag': google,
        '*tag': google,
    };

    annyang.addCommands(commands);

    annyang.start();
}

function google(s) {
    animateBack()
    checkFirstTime();

    setTimeout(() => {
        window.open('http://google.com/search?q='+s, "_blank");     
    }, 1500);
}

function animateBack() {
    var r = Math.floor(Math.random() * (255 - 0 + 1)) + 0;
    var g = Math.floor(Math.random() * (255 - 0 + 1)) + 0;
    var b = Math.floor(Math.random() * (255 - 0 + 1)) + 0;
    //console.log("rgb(" + r + "," + g  + "," + b +")");
    let rgb = "rgb(" + r + "," + g  + "," + b +")";
    document.body.style.backgroundColor =  rgb;
}

