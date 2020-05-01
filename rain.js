console.log("Alhamdulillah Bismillah");
var id;
var FPS = 60;
const total_drop = 500;
const color_back = "rgb(198, 247, 223)";
const color_drop = "rgb(30, 156, 94)";
const key_R = 82;
const key_LEFT = 37;
const key_RIGHT = 39;
let dir = '0';
var canvas = document.getElementById("canvas_board");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var r = [];
function init() {for (var i = 0; i < total_drop; i++) {r[i] = new rainDrop(color_drop);}}
function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
    }, 1000 / FPS);
    
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = color_back;
    for (var i = 0; i < total_drop; i++) {
        r[i].show(dir);
        r[i].fall();
    }
}


function onkeydownn(event) {
    //console.log(event.keyCode);
    //l = 37 && r = 39
    if(event.keyCode == key_R) {
        window.location.reload();
    }else if(event.keyCode == key_LEFT) {
        dir = 'L';
    }else if(event.keyCode == key_RIGHT){
        dir = 'R';
    }
}

init();
render();