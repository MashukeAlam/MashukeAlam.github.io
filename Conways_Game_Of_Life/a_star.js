var start, end;
var select = 0;
const feild = document.getElementById('grid');
const slider = document.getElementById('animation_speed');
var c = feild.getContext("2d");
c.fillStyle = "#0099ff";
var DONE = 0;
let dontAnimateBlank = 0;
let animation_go_on = 1;
let WIDTH = innerWidth;
let HEIGHT = innerHeight;
feild.width = feild.height = 800;
var cols = rows = 30;
var forMouseClick = feild.width / cols;
var w = feild.width / cols;
var h = feild.height / rows;
const pendingColor = 'rgba(14, 230, 14, 1.0)';
const startColor = 'rgb(252, 3, 198)';
const endColor = 'rgb(252, 111, 3)';
const processedColor = 'red';
const boardColor = 'rgb(85, 85, 240)';
const obstacleColor = 'rgb(120, 0, 24)';
let speed = 70;
var pendingPoints = [];
var processedPoints = [];
let LIFE = false;
let ifMouseDown = false;

var final_path = [];

function createGrid(x, y) {
    var grid = new Array(x);
    for (var i = 0; i < grid.length; i++) {
        grid[i] = new Array(y);
    }

    for (var i = 0; i < x; i++) {
        for (var j = 0; j < y; j++) {
            grid[i][j] = new Point(i, j);
        }
    }

    return grid;
}

var grid = createGrid(cols, rows);
//console.log(grid);
function reset() {
    final_path = [];
    processedPoints = [];
    pendingPoints = [];
    DONE = 0;
    animation_go_on = 1;
}
function Point(x, y) {
    this.x = x;
    this.y = y;
    this.neightbours = [];
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.prev = null;
    this.obstacle = false;
    // this.obstacle = (Math.random() > 0.3) ? false : true;
    this.alive = false;




    this.show = function (color) {
        c.fillStyle = color;
        c.strokeStyle = 'black';
        c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
        c.fillRect(this.x * w, this.y * h, w - 1, h - 1);
    }

    this.showPath = function () {
        var p = this.prev;
        while (p != null) {
            final_path.push(p);
            p = p.prev;
        }
    }

}

function reset_board() {
    window.location.reload();

}

const next_gen = () => {
    // console.log('here');
    // let future_gen = grid;
    let future_gen = createGrid(800, 800);
    for (let row = 1; row < grid.length - 1; row++) {
        for (let col = 1; col < grid[row].length - 1; col++) {
            let currPoint = grid[row][col];
            let currIsAlive = currPoint.obstacle;
            // console.log(currPoint.neightbours);
            let numberOfAliveNeighbors = 0;

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    // console.log(row + i, col + j);
                    if (grid[row + i][col + j].obstacle) {

                        numberOfAliveNeighbors++;
                    }
                }
            }
            grid[row][col].obstacle ? numberOfAliveNeighbors-- : numberOfAliveNeighbors;
            // console.log(numberOfAliveNeighbors);
            if (currIsAlive && numberOfAliveNeighbors < 2) {
                future_gen[row][col].obstacle = false;
            } else if (currIsAlive && numberOfAliveNeighbors > 3) {
                future_gen[row][col].obstacle = false;
            } else if (!currIsAlive && numberOfAliveNeighbors == 3) {
                future_gen[row][col].obstacle = true;
                console.log('here');
            } else {
                future_gen[row][col].obstacle = grid[row][col].obstacle;
            }
        }
    }


    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            // console.log(grid[row][col].obstacle);
            grid[row][col].obstacle = future_gen[row][col].obstacle;
        }
    }

}

function animate_begin() {
    setTimeout(() => {
        if (dontAnimateBlank != 1) {
            // console.log('animating blank');

            requestAnimationFrame(animate_begin);
            c.fillStyle = 'white';
            c.fillRect(0, 0, 800, 800);

            // next_gen();

            if (LIFE) {
                next_gen();
            }

            for (var i = 0; i < grid.length; i++) {
                for (var j = 0; j < grid[i].length; j++) {
                    if (grid[i][j].obstacle) {

                        grid[i][j].show(obstacleColor)

                    }
                    else {
                        grid[i][j].show(boardColor);
                    }

                }
            }
        }
    }, 250);

}
animate_begin();

function select_s() {
    select = 33;
}

function select_e() {
    select = 66;
}

feild.addEventListener('click', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    //console.log(x, y);
    //console.log(x/25, y/25);

    if (select == 33) {
        select = 0;
        start = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(startColor);
    } else if (select == 66) {
        select = 0;
        end = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(endColor);
    } else {
        grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
        // grid[x - 1][y - 1].alive = !grid[x - 1][y - 1].alive;

    }


});

feild.addEventListener('mousedown', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    console.log('mousedown');
    ifMouseDown = true;
    //console.log(x/25, y/25);

    if (select == 33) {
        select = 0;
        start = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(startColor);
    } else if (select == 66) {
        select = 0;
        end = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(endColor);
    } else {
        grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
        // grid[x - 1][y - 1].alive = !grid[x - 1][y - 1].alive;

    }


});

feild.addEventListener('mouseup', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    console.log('mouseup');
    ifMouseDown = false;
    //console.log(x/25, y/25);

    if (select == 33) {
        select = 0;
        start = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(startColor);
    } else if (select == 66) {
        select = 0;
        end = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(endColor);
    } else {
        grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
        // grid[x - 1][y - 1].alive = !grid[x - 1][y - 1].alive;

    }


});

feild.addEventListener('mousemove', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    console.log(x, y);
    //console.log(x/25, y/25);

  if(ifMouseDown) {
      grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
  } else if(!grid[x - 1][y - 1].obstacle) {

      grid[x - 1][y - 1].show('rgb(99, 99, 250)');
  }
   
});


const start_life = () => {
  
    LIFE = true;
    animate_begin();
}



