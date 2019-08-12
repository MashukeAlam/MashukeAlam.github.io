console.log('alhamdulillah');
let LIMIT = 100;


//FIREBASE
var db = firebase.database();
var REF = db.ref('scores');
//
let DIR = 'RIGHT';
let FPS = 10;
let SCORE = 0;

document.addEventListener("keydown", press);

var canvas = document.getElementById("canvas_board");
var c = canvas.getContext("2d");
c.fillStyle = "#0099ff";


let WIDTH = innerWidth;
let HEIGHT = innerHeight;
let PERSON;
while(true) {
    PERSON = prompt("Please enter your name", "");
    if(PERSON != null) {
        
        break;
    }

}
//player
function Player(name, score) {
    this.name = name;
    this.score = score;
}
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
        var left = LIMIT - Math.floor(TIME);
        c.font = "19px Arial";
        c.fillStyle = "white";
        c.fillText("Score: " + SCORE, canvasW - 180, 60);
        c.fillText("Time left: " + left + " seconds", canvasW - 200, 30)
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
            headX = 0;
        } else if (headX < 0) {
            headX = canvasW;
        } else if (headY > canvasH) {
            headY = 0;
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
        if(randomX < 20 && randomY < 20) {
            randomX += 20;
            randomY += 20;
        }
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

s.lenUpdate();
s.lenUpdate();
let TIME = 0;
var id = null;
function animate() {
    
    id = setTimeout(function () {
        requestAnimationFrame(animate);
        TIME += 0.1;
    }, 1000 / FPS);
    //console.log('animating');
    c.fillStyle = "green";
    c.fillRect(0, 0, canvasW, canvasH);
    //s.lenUpdate();
    s.draw();
    s.game();
    if(TIME > LIMIT) {
        clearTimeout(id);
        //requestAnimationFrame(null)
        submitScore(SCORE);
    }
    //TIME++;
    console.log(TIME);
    
}
var playersInfo =  [];
function submitScore(x) {
    var data2Push = {
        name: PERSON,
        browser: navigator.userAgent,
        score: x
    }
    REF.push(data2Push); 
    REF.on('value', gotdata, errdata);
    
    function gotdata(data) {
        var s = data.val();
        var keys = Object.keys(s);
        console.log(keys);

        for(var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var name = s[k].name;
            var point = s[k].score;
            console.log(name, point);
            var p = new Player(name, point);
            playersInfo.push(p);
        }
        
        playersInfo.sort(comp);
        console.log(playersInfo);
        makeTable(playersInfo);        
    }

    function errdata(err) {
        console.log(err);
        
    }
}

function makeTable(a) {
    console.log(a);
    
    for(var i = a.length - 1; i >= 0; i--) {
        var p = document.createElement('p');
        p.style.marginBottom = 6;
        p.style.marginLeft = 6;
        p.style.fontSize = 12;
        var rank = a.length - i;
        p.innerHTML ="Rank #: " + rank +  " |Name: " + a[i].name + "    Score: " + a[i].score;
        if(a.length - i <= 3) {
                p.style.color = "green";
                p.style.fontStyle = "italic";
                p.style.fontWeight = "bold";
        }
        document.body.appendChild(p);
    }
   
}
function comp(a, b) {
    if(a.score > b.score) return 1;
    if(a.score < b.score) return -1;
    return 0;
}
animate();
