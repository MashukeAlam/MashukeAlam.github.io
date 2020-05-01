console.log('alhamdulillah');

var _time = -1;
const _min15 = 15;
const _min25 = 25;
const _min30 = 30;
const _min40 = 40;
const interval = 60000;
//get HTML elements
const btn15 = document.getElementById("min15");
const btn25 = document.getElementById("min25");
const btn30 = document.getElementById("min30");
const btn40 = document.getElementById("min40");
const sound_end = document.getElementById("timeUp");
const sound_recharge = document.getElementById("recharge");
const remaining = document.getElementById("remaining_time");
const breakBtn = document.getElementById("break");
const watch_face = document.getElementById("watch_face");

function click15() {
    if (_time != _min15) {
        _time = _min15;
        remaining.innerHTML = _time + " Minute set... Press again to start";
    } else if (_time == _min15) {
        remaining.innerHTML = _time + " Minutes left";
        start();
    }
}

function click25() {
    if (_time != _min25) {
        _time = _min25;
        remaining.innerHTML = _time + " Minute set... Press again to start";
    } else if (_time == _min25) {
        remaining.innerHTML = _time + " Minutes left";
        start();
    }
    remaining.innerHTML = _time + " Minute set... Press again to start";
}

function click30() {
    if (_time != _min30) {
        _time = _min30;
        remaining.innerHTML = _time + " Minute set... Press again to start";
    } else if (_time == _min30) {
        remaining.innerHTML = _time + " Minutes left";
        start();
    }
}

function click40() {
    if (_time != _min40) {
        _time = _min40;
        remaining.innerHTML = _time + " minute set... Press again to start";
    } else if (_time == _min40) {
        remaining.innerHTML = _time + " Minutes left";
        start();
    }
}

function start() {
    watch_face.style.backgroundImage = "url('./images/ben10-green.jpg')";
    btn15.disabled = true;
    btn25.disabled = true;
    btn30.disabled = true;
    btn40.disabled = true;
    var timer = setInterval(() => {
        //console.log(--_time);
        --_time;
        remaining.innerHTML = _time + " minutes left";
        if(_time == 0) {
            clearInterval(timer);
            sound_end.play();
            watch_face.style.backgroundImage = "url('./images/ben10-red.png')";
            remaining.innerHTML = "Now take a break... Sit up and stretch your body !";
            breakBtn.style.display = "inline";
        }      
    }, interval);
}

function breakTime() {
    breakBtn.style.display = "none";
    watch_face.style.backgroundImage = "url('./images/ben10-yellow.png')";
    btn15.disabled = true;
    btn25.disabled = true;
    btn30.disabled = true;
    btn40.disabled = true;
    _breakTime = 5;
    var timer = setInterval(() => {
        //console.log(--_time);
        --_breakTime;
        remaining.innerHTML = _breakTime + " minutes left";
        if(_breakTime == 0) {
            clearInterval(timer);
            sound_recharge.play();
            remaining.innerHTML = "Get back to work now !";
            breakBtn.style.display = "inline";
        }      
    }, interval);
}