const canvas = document.getElementById("canvas");
const _pi = document.getElementById("pi");
const _err = document.getElementById("err");
const speed = document.getElementById("fps");
const thr = document.getElementById("thr");
var ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;
const color_back = "rgb(179, 246, 255)";
const color_inside_circle = "rgb(195, 16, 227)";
const color_outside_circle = "rgb(31, 224, 25)";
let FPS = 20;
let total_points = 0;
let circle_points = 0;
let pi;
let numberOfThrows = 10;

function init() {
    ctx.fillStyle = color_back;
    ctx.fillRect(0, 0, 500, 500);



    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 499, 499);


    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgb(164, 164, 237)";
    ctx.fill();
    ctx.strokeStyle = "rgb(15, 15, 212)";
    ctx.stroke();
}
function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
    }, 1000 / FPS);

    for (var i = 0; i < numberOfThrows; i++) {
        let x = getRandomInt(499);
        let y = getRandomInt(499);
        let d = Math.sqrt((x - canvas.width / 2) * (x - canvas.width / 2) + (y - canvas.width / 2) * (y - canvas.width / 2));
        total_points++;
        if (d < canvas.width / 2) {
            ctx.fillStyle = color_inside_circle;
            ctx.fillRect(x, y, 4, 4);
            circle_points++;
        } else {
            ctx.fillStyle = color_outside_circle;
            ctx.fillRect(x, y, 4, 4);
        }
    }

    pi = 4 * (circle_points / total_points);
    _pi.innerHTML = "PI ~ " + pi;
    _err.innerHTML = "Error = " + ((Math.abs(Math.PI - pi) / pi) * 100).toFixed(2) + "%";


}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function changeFPS() {
    FPS = speed.value;
}

function changeThrows() {
    numberOfThrows = thr.value;
}
render();
init();