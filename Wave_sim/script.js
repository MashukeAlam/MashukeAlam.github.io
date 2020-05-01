const canvas = document.getElementById("canvas");
const speed = document.getElementById("fps");
var ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;
const color_back = "rgb(0, 0, 0)";
const color_inside_circle = "rgb(195, 16, 227)";
const color_outside_circle = "rgb(31, 224, 25)";
let FPS = 20;
let total_points = 0;
let circle_points = 0;
let pi;
let numberOfThrows = 10;
let amplitude = 50;
const radius = 5;
particles = [];
var numberOfParticles = 500 / radius;

function init() {
    for(var i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle(2 * radius  * i, 500/2));
    }

    
}init();

function singleShot() {
    ctx.fillStyle = color_back;
    ctx.fillRect(0, 0, 500, 500);
    for(var i = 0; i < numberOfParticles; i++) {
        particles[i].show();
        particles[i].jump(amplitude);
    }
}



function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
        
        
    }, 1000 / FPS);
    
    ctx.fillStyle = color_back;
    ctx.fillRect(0, 0, 500, 500);

    for(var i = 0; i < numberOfParticles; i++) {
    particles[i].show();
    particles[i].jump(amplitude);
    }
}

function changeFPS() {
    FPS = speed.value;
}


render();