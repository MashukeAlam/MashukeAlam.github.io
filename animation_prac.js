const vdo = document.querySelector(".vdo");
const video = vdo.querySelector("video");
const text = vdo.querySelector("h1");
const div = document.getElementById("gr");
let firstTime = 1;

//SCROLLMAGIC
const controller = new ScrollMagic.Controller();

//Scenes
let scene = new ScrollMagic.Scene({
    duration: 9000,
    triggerElement: vdo,
    triggerHook: 0
})
    .addIndicators()
    .setPin(vdo)
    .addTo(controller);

//Video Animation
let scrollpos = 0;
let curr = 0;

scene.on("update", e => {
    //console.log(e.scrollPos);    
    scrollpos = e.scrollPos / 1000;
});

setInterval(() => {
    
    if (firstTime == 1) {
        video.currentTime = 0;
        window.scrollTo(0, 0);
        firstTime = 0
    }

    curr = (curr + (scrollpos - curr))
    video.currentTime = curr;

    if (Math.ceil(curr) < 7) {
        div.style.opacity = 1;
        fade(Math.floor(curr % 7))
    }else {
        div.style.opacity = .4;
        console.log("triggered!");
    }
}, 33.3);

//Text Animation
let texts = ["Welcome", "Jim Here !", "I'm a novice trying to succeed", "Deam & Hope is my weapon to move on", "Trying to do something bigg 😊", "Keep me in your prayers !"];
let nowI = -1;
var elem = $("#animText");

function fade(i) {
    if (nowI == i) {
        return;
    } else {
        nowI = i;
    }
    elem.fadeOut(function () {
        elem.html(texts[i]);

        elem.fadeIn();
    });
}

