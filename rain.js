console.log("Alhamdulillah Bismillah");

//RAINDROP
class rainDrop {

    constructor() {
        this.x =  rainDrop.getRandomInt(window.innerWidth);
        this.y = rainDrop.getRandomInt(window.innerHeight);
        this.speed = rainDrop.getRandomInt(8) + 2;;
    }

    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    show(color) {
        ctx.beginPath();
        // Staring point (10,45)
        ctx.moveTo(this.x, this.y);
        // End point (180,47)
        ctx.lineTo(this.x, this.y + 30);
        // Make the line visible
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    fall() {
        this.y += this.speed;
        if(this.y > window.innerHeight) {
            this.y = rainDrop.getRandomInt(10);
        } 
    }
}

var id;
var FPS = 60;
var canvas = document.getElementById("canvas_board");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;
var COLORS = ["blue", "purple", "lightblue", "green", "lightgreen", "yellow", "orange", "darkorange", "darkred", "pink", "lightred"];
var indx = 1;
var r = [];
function init() {
    for (var i = 0; i < 500; i++) {
        r[i] = new rainDrop();
    }
}


function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
    }, 1000 / FPS);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < 500; i++) {
        r[i].show(COLORS[indx]);
        r[i].fall();
    }

}

function blue() {
    
    indx = rainDrop.getRandomInt(COLORS.length);
    
}



init();
render();