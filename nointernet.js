console.log('Alhamdulillah Bismillah');

class dino {
    constructor() {
        this.x = 90;
        this.y = 350;
    }

    show() {

        con.beginPath();
        con.arc(90, this.y, 20, 0, 2 * Math.PI);
        con.strokeStyle = "red";
        con.stroke();
    }

    jump() {
        var diff = ob.x - this.x;
        var collided = 0;

        if (diff >= 77 && diff <= 105) {
            SCORE++;
        } else {
            collided = 1;
        }
        var int = setInterval(() => {
            if (this.y > 240) this.y -= 2;
            else {
                clearInterval(int);
                if (collided == 1) {
                    clearTimeout(id);
                    con.font = "35px Arial"
                    con.fillStyle = "red";
                    con.fillText("Game over! score was: " + SCORE, 90, 100);
                }
                var i = setInterval(() => {
                    if (this.y < 350) this.y++;
                    else clearInterval(i);
                }, .001);
            }


        }, .001);

    }
}

class obst {
    constructor() {
        this.x = canvas.width;
    }

    see() {
        drawLine(this.x, 370, this.x, 370 - obstacleLen);
    }

    move() {
        this.x -= 6;


        if (this.x < 0) this.x = canvas.width + Math.floor(Math.random() * 40)
    }
}

document.addEventListener("keydown", press);

var SCORE = 0;
var c = document.getElementById("canvas");
var con = c.getContext("2d");
var FPS = 60;
var obstacleLen = 70;
var SPACE = 32;
c.width = window.innerWidth;
c.height = window.innerHeight;

c.style.backgroundColor = "lightgrey";


function drawLine(x1, y1, x2, y2) {
    con.beginPath();
    con.moveTo(x1, y1);
    con.lineTo(x2, y2);
    con.strokeStyle = "black";
    con.stroke();
}
var di = new dino();
var ob = new obst();

function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
    }, 1000 / FPS);
    con.fillStyle = "lightgrey";
    con.font = "19px Arial";

    con.fillRect(0, 0, innerWidth, innerHeight);
    con.fillStyle = "black";
    con.fillText("Score: " + SCORE, 50, 50);
    drawLine(0, 370, canvas.width, 370);
    di.show();
    ob.see();
    ob.move();
}

function press(e) {
    var keyCode = e.keyCode;
    if (keyCode == SPACE) {
        di.jump();
    }

}
render();