
//FIREBASE
const database = firebase.firestore();
var snakeRef = database.collection('user').doc('snake');
//

console.log('alhamdulillah');
let DIR = 'RIGHT';
let FPS = 10;
let SCORE = 0;

document.addEventListener("keydown", press);

var canvas = document.getElementById("canvas_board");
var c = canvas.getContext("2d");
c.fillStyle = "#0099ff";


let WIDTH = innerWidth;
let HEIGHT = innerHeight;

let PERSON = prompt("Please enter your name", "");
//food
function Food(x, y) {
    this.x = x;
    this.y = y;
}
var food = new Food(20, 30);
//box
function Box(x, y) {
    this.x = x;
    this.y = y;
}
//snake

function Snake() {
    this.body = [];
    this.x = 100;
    this.y = 100;
    this.dx = 10;
    this.dy = 10;

    this.lenUpdate = function () {
        var b = new Box(this.x, this.y);
        this.x += 10;
        //this.y += 10;
        this.body.push(b);
    }

    this.draw = function () {

        //console.log(temp.pop());
        //this.y += 10;
        //this.y += 10;
        c.font = "19px Arial";
        c.fillStyle = "white";
        c.fillText("" + SCORE, canvasW - 30, 30);
        for (var i = 0; i < this.body.length; i++) {
            var piece = this.body[i];
            c.fillStyle = 'lightgreen';
            c.strokestyle = 'darkgreen';
            c.strokeRect(piece.x, piece.y, 10, 10);
            c.fillRect(piece.x, piece.y, 10, 10);
        }

        c.strokestyle = "lightred";
        c.fillStyle = "darkred";
        c.fillRect(food.x, food.y, 10, 10);
        
    }

    this.game = function () {
        //console.log(random);

        var headX = this.body[0].x;
        var headY = this.body[0].y;
        //console.log(this.eat(headX, headY));
        
        if(this.eat(headX, headY)) {
            //console.log('alhamdulillah');
            
            var pos = randomFoodPos();
            food.x = pos[0];
            food.y = pos[1];
            //console.log(food.x, food.y);
            this.lenUpdate();
            SCORE++;
            
        }

        
        this.body.pop();
        if (headX > canvasW) {
            headX = headX - canvasW;
        } else if (headX < 0) {
            headX = canvasW;
        } else if (headY > canvasH) {
            headY = headY - canvasH;
        } else if (headY < 0) {
            headY = canvasH;
        }
        if (DIR == 'RIGHT') {
            var newBox = new Box(headX + 10, headY);
            this.body.unshift(newBox);
            //console.log('working');

        } else if (DIR == 'UP') {
            var newBox = new Box(headX, headY - 10);
            this.body.unshift(newBox);
            //console.log('working');
        } else if (DIR == 'DOWN') {
            var newBox = new Box(headX, headY + 10);
            this.body.unshift(newBox);
            //console.log('working');
        } else if (DIR == 'LEFT') {
            var newBox = new Box(headX - 10, headY);
            this.body.unshift(newBox);
            //console.log('working');
        }
        //console.log(headX, headY);
        //this.draw();

        

    }

    this.eat = function(x, y) {
        if(x == food.x && y == food.y) {
            //console.log('Alhamdulillah yeah');
            return true;
        }else return false;
    }

    this.collision = function(x, y) {
        //console.log(x, y);
        
        for(var i = 0; i < this.body.length; i++) {
            if(x == this.body[i].x && y == this.body[i].y) return true;
        }
        return false;
    }
}

function init() {
    canvas = document.getElementById("canvas_board");
    canvas.width = canvas.height = 500; //document.width is obsolete
    canvasW = canvas.width;
    canvasH = canvas.height;
}

function randomFoodPos() {
    var min = 0;
        var max = canvasW;
        var randomX = Math.ceil(Math.random() * 50 )  * 10;
        var randomY = Math.ceil(Math.random() * 50 ) * 10;
        //console.log(randomX, randomY);
        
        return [randomX, randomY];
}

function press(e) {
    // console.log('alhamdulillah');  
    var keyCode = e.keyCode;
    //console.log(keyCode);
    if (keyCode == 38 && DIR != 'DOWN') {
        //console.log('W');
        DIR = 'UP';
    } else if (keyCode == 37 && DIR != 'RIGHT') {
        //console.log('A');
        DIR = 'LEFT';
    }
    else if (keyCode == 40 && DIR != 'UP') {
        //console.log('S');
        DIR = 'DOWN';
    }
    else if (keyCode == 39 && DIR != 'LEFT') {
        //console.log('D');
        DIR = 'RIGHT';
    } 
}

init();
var s = new Snake();
var l = new Snake();
l.y = 300;

s.lenUpdate();
s.lenUpdate();
l.lenUpdate();
l.lenUpdate();
function animate() {
    setTimeout(function () {
        requestAnimationFrame(animate);

    }, 1000 / FPS);
    //console.log('animating');
    c.fillStyle = "green";
    c.fillRect(0, 0, canvasW, canvasH);
    //s.lenUpdate();
    s.draw();
    s.game();
    //s.lenUpdate();
    l.draw();
    l.game();
}


animate();



//SERVER FIREBASE WRITE READ
var names;
var jim = ["ss", "ff"];
var write = function (x) {
    console.log('ssssssssssss');
    read();
    snakeRef.update({
        who: x
    }).then(function () {
    }).catch(function (err) {
    });
}
var read = function () {
    var arr;
    snakeRef.onSnapshot(function (doc) {
        if(doc && doc.exists) {
            var arr = doc.data().who;
            
                
        }
    });

    //console.log(names);
    
    
}
 
function doSomething(a) {
    names = a;
    console.log(a, names);
    names.push(PERSON);
    
}


