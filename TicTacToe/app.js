var start, end;
var select = 0;
const feild = document.getElementById('grid');
const slider = document.getElementById('animation_speed');
const resP = document.getElementById('result');
var c = feild.getContext("2d");
c.fillStyle = "#0099ff";
var DONE = 0;
let dontAnimateBlank = 0;

let WIDTH = innerWidth;
let HEIGHT = innerHeight;
feild.width = feild.height = 800;
var cols = rows = 3;
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
let board = ['', '', '', '', '', '', '', '', ''];


let ai = 'X';
    let human = 'O';
    let turn = (ai == 'X') ? ai : human; 
    let animation_go_on = 0;
    const popupDiv = document.querySelector('.popup');
const overlayDiv = document.getElementById('overlay');
const openpop = () => {
    popupDiv.classList.add('active');
    overlayDiv.classList.add('active');
}

const closepop = () => {
    // console.log(454545);
    popupDiv.classList.remove('active');
    overlayDiv.classList.remove('active');
    animation_go_on = 1;
    animate_begin();
}

overlayDiv.addEventListener('click', () => {
    closepop();
});

const humanX = (f) => {
    // ;console.log(4545798213);
    if (f === 'X') {
        human = 'X';
        ai = 'O';
    } else {
        ai = 'X';
        human = 'O';
    }
     turn = (ai == 'X') ? ai : human; 
    closepop();
}

const result = () => {
    let states = []
    states.push(board.slice(0, 3).join(''));
    states.push(board.slice(3, 6).join(''));
    states.push(board.slice(6, 9).join(''));
    states.push((board[0] + board[3] + board[6]));
    states.push((board[1] + board[4] + board[7]));
    states.push((board[2] + board[5] + board[8]));
    states.push((board[0] + board[4] + board[8]));
    states.push((board[2] + board[4] + board[6]));

    // console.log(states);

    for (let i = 0; i < 8; i++) {
        if (states[i] === 'XXX') return 'X';
        if (states[i] === 'OOO') return 'O';
    }
    let count = 0;
    board.forEach(el => {
        // console.log(el, el === '');
        if (el === '') {
            count ++;
        }
    });

    return (count === 0) ? 'tie' : undefined;
}


const minimax = (depth, isMax) => {
    const res = result();

    if (res) {
        // console.log(res, 454545);
        if (res == human) {
            return -1;
        } else if (res == ai) {
            return 1;
        } else {
            return 0;
        }
    }

    if (isMax) {
        let bestScore = -Infinity;

        for (let i = 0; i < 9; i++) {
            if (board[i] == '') {
                board[i] = ai;
                const score = minimax(depth + 1, false);
                board[i] = '';
                bestScore = Math.max(bestScore, score);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;

        for (let i = 0; i < 9; i++) {
            if (board[i] == '') {
                board[i] = human;
                const score = minimax(depth + 1, true);
                board[i] = '';
                bestScore = Math.min(bestScore, score);
            }
        }
        return bestScore;
    }
}

const aiMove = () => {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] == '') {
            board[i] = ai;
            const score = minimax(0, false);
            board[i] = '';
            // console.log(score, i);
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    turn = human;
    return bestMove;
}

const put = (position, turn) => {
    if (board[position] == '') {
        board[position] = turn;
    }
}

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
    




    this.show = function (color) {
        c.fillStyle = color;
        c.strokeStyle = 'black';
        c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
        c.fillRect(this.x * w, this.y * h, w - 1, h - 1);
        c.textAlign = 'center';
        c.textBaseLine = 'middle';
        c.fillStyle = 'black';
        c.font = `${160}px Verdana`;
        c.fillText(board[this.x + (this.y * 3)], this.x * w + w/2, this.y * h + h/2);
    }

    

}

function reset_board() {
    window.location.reload();

}

function animate_begin() {
    setTimeout(() => {
        if (dontAnimateBlank != 1 && animation_go_on === 1) {

            requestAnimationFrame(animate_begin);
            c.fillStyle = 'white';
            c.fillRect(0, 0, 800, 800);

            const res = result();
            if (res) {
                if (res === ai) {
                    resP.innerHTML = 'AI wins!';
                } else if (res === human) {
                    resP.innerHTML = 'Human wins!';
                } else  {
                    resP.innerHTML = 'Match tied!';
                }
                animation_go_on = 0;
            }

            if (turn == ai) {
                put(aiMove(), ai);
            }

            for (var i = 0; i < grid.length; i++) {
                for (var j = 0; j < grid[i].length; j++) {
                    
                    
                        grid[i][j].show(boardColor);
                    

                }
            }
        }
    }, 250);

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
    ifMouseDown = true;
    // console.log(3 * (y - 1) + (x - 1));

    if (turn == human) {
        put(3 * (y - 1) + (x - 1), human);
        // board[3 * (y - 1) + (x - 1)] = human;
        turn = ai;
    }

    


});

feild.addEventListener('mouseup', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
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
    } 


});

feild.addEventListener('mousemove', event => {
    let bound = feild.getBoundingClientRect();

    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    //console.log(x/25, y/25);

  if(ifMouseDown) {
      grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
  }
   
});




