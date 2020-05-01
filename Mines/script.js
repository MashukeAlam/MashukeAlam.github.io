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
feild.width = feild.height = 500;
var cols = rows = 10;
var forMouseClick = feild.width / cols;
var w = feild.width / cols;
var h = feild.height / rows;
const pendingColor = 'rgba(14, 230, 14, 1.0)';
const startColor = 'rgb(252, 3, 198)';
const endColor = 'rgb(252, 111, 3)';
const processedColor = 'red';
const boardColor = 'lightblue';
const obstacleColor = 'black';
let speed = 70;

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
    start = grid[0][0];
    end = grid[x - 1][y - 1];
    return grid;
}

var grid = createGrid(cols, rows);
function reset() {
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
    this.isRevealed = false;
    this.initialColor = boardColor;
    this.afterRevealColor = startColor;
    this.numberOfObstacle = 0;
    this.txtColor = 'black';
    this.flagged = false;
    
    this.setTextColor = function () {
        //This func must be called after whats inside func...

        if(this.numberOfObstacle == 0) {
            this.txtColor = 'green';
        }else if(this.numberOfObstacle == 1) {
            this.txtColor = 'blue';
        }else if(this.numberOfObstacle == 2) {
            this.txtColor = 'grey';
        }else if(this.numberOfObstacle == 3) {
            this.txtColor = 'orange';
        }
    }

    this.determineObstacle = function () {
        var r = Math.ceil(Math.random() * 6);
        //console.log(r, r%3);

        if (r % 5 === 0) {
            this.obstacle = true;
        }

        return this.obstacle;

    }

    this.whatsInside = function () {
        //this function must be called after determineobstacle is called
        if (grid[this.x][this.y].obstacle) {
            return;
        } else {
            this.createNeighbors();
            for (var i = 0; i < this.neightbours.length; i++) {
                if (this.neightbours[i].obstacle) {
                    this.numberOfObstacle++;
                }
            }
        }

        this.setTextColor();

    }

    this.createNeighbors = function () {
        var i = this.x;
        var j = this.y;

        try { if (grid[i + 1][j] != undefined) { this.neightbours.push(grid[i + 1][j]); } } catch (err) { }
        try { if (grid[i - 1][j] != undefined) { this.neightbours.push(grid[i - 1][j]); } } catch (err) { }
        try { if (grid[i][j + 1] != undefined) { this.neightbours.push(grid[i][j + 1]); } } catch (err) { }
        try { if (grid[i][j - 1] != undefined) { this.neightbours.push(grid[i][j - 1]); } } catch (err) { }
        try { if (grid[i + 1][j + 1] != undefined) { this.neightbours.push(grid[i + 1][j + 1]); } } catch (err) { }
        try { if (grid[i - 1][j - 1] != undefined) { this.neightbours.push(grid[i - 1][j - 1]); } } catch (err) { }
        try { if (grid[i + 1][j - 1] != undefined) { this.neightbours.push(grid[i + 1][j - 1]); } } catch (err) { }
        try { if (grid[i - 1][j + 1] != undefined) { this.neightbours.push(grid[i - 1][j + 1]); } } catch (err) { }

    }

    this.show = function () {
        if (!this.isRevealed) {
            c.fillStyle = this.initialColor;
            c.strokeStyle = 'black';
            c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
            c.fillRect(this.x * w, this.y * h, w - 1, h - 1);
        } else {
            if(this.flagged) {
                c.fillStyle = 'black';
                c.strokeStyle = 'white';
                c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
                c.fillRect(this.x * w, this.y * h, w - 1, h - 1);

            }
            else if (this.obstacle) {
                c.fillStyle = 'red';
                c.strokeStyle = 'black';
                c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
                c.fillRect(this.x * w, this.y * h, w - 1, h - 1);
            } else {
                c.fillStyle = 'white';
                c.strokeStyle = 'black';
                c.strokeRect(this.x * w, this.y * h, w - 1, h - 1);
                c.fillRect(this.x * w, this.y * h, w - 1, h - 1);


                let n = this.numberOfObstacle;
                c.font = "20px Comic Sans MS";
                c.fillStyle = this.txtColor;
                c.textAlign = 'center';
                c.fillText('' + n, this.x * w + 25, this.y * h + 25);
            }
        }
    }

    this.showPath = function () {
        var p = this.prev;
        while (p != null) {
            final_path.push(p);
            p = p.prev;
        }
    }

}

function init() {
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            (grid[i][j].determineObstacle());
        }
    }

    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            grid[i][j].whatsInside();
        }
    }
}

function animate() {
    if (animation_go_on) {
        requestAnimationFrame(animate);
    }

    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            grid[i][j].show();
        }
    }
}

feild.addEventListener('click', event => {
    let bound = feild.getBoundingClientRect();
    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    processThisCell(x - 1, y - 1);
});

feild.addEventListener('contextmenu', event => {
    let bound = feild.getBoundingClientRect();
    let x = Math.ceil((event.clientX - bound.left - feild.clientLeft) / forMouseClick);
    let y = Math.ceil((event.clientY - bound.top - feild.clientTop) / forMouseClick);
    grid[x - 1][y - 1].isRevealed = true;
    grid[x - 1][y - 1].flagged = true;
}, false);

function processThisCell(x, y) {
    if(grid[x][y].obstacle) {
        grid[x][y].isRevealed = true;
        animation_go_on = 0;
    }else if(grid[x][y].numberOfObstacle == 0) {
        dfs(x, y, true);
    }else {
        grid[x][y].isRevealed = true;
    }
}


function dfs(x, y, goFurther) {
    grid[x][y].isRevealed = true;
    var neighs = grid[x][y].neightbours;
    for(var i = 0; i < neighs.length; i++) {
        if(neighs[i].numberOfObstacle == 0 && !neighs[i].isRevealed) {
            dfs(neighs[i].x, neighs[i].y, goFurther);
        } else if(neighs[i].numberOfObstacle != 0 && !neighs[i].isRevealed && goFurther && !neighs[i].obstacle) {
            neighs[i].isRevealed = true;
        }
    }
}

init();

animate();