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
var cols = rows = 20;
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
var pendingPoints = [];
var processedPoints = [];

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
    start = grid[0][0];
    end = grid[x - 1][y - 1];
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

    this.determineObstacle = function () {
        var r = Math.ceil(Math.random() * 4);
        //console.log(r, r%3);

        if (r % 3 === 0) {
            this.obstacle = true;
        }

    }

    this.createNeighbors = function () {
        var i = this.x;
        var j = this.y;

        try { if (grid[i + 1][j] != undefined) { this.neightbours.push(grid[i + 1][j]); } } catch (err) { }
        try { if (grid[i - 1][j] != undefined) { this.neightbours.push(grid[i - 1][j]); } } catch (err) { }
        try { if (grid[i][j + 1] != undefined) { this.neightbours.push(grid[i][j + 1]); } } catch (err) { }
        try { if (grid[i][j - 1] != undefined) { this.neightbours.push(grid[i][j - 1]); } } catch (err) { }
        //try { if (grid[i + 1][j + 1] != undefined) { this.neightbours.push(grid[i+1][j + 1]); } } catch (err) { }
        //try { if (grid[i - 1][j - 1] != undefined) { this.neightbours.push(grid[i-1][j - 1]); } } catch (err) { }

    }

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

function a_star() {
    reset();
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            //grid[i][j].determineObstacle();
            grid[i][j].createNeighbors();
        }
    }

    start.obstacle = false;
    end.obstacle = false;

    pendingPoints.push(start);

    animate_a();

}
function dhix_start() {
    reset();
    dontAnimateBlank = 1;
    speed = slider.value;
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            //grid[i][j].determineObstacle();
            grid[i][j].createNeighbors();
        }
    }

    start.obstacle = false;
    end.obstacle = false;

    pendingPoints.push(start);

    animate_d();

}



function animate_a() {

    if (pendingPoints.length > 0) {
        //console.log(DONE);

        if (DONE != 1 && animation_go_on === 1) {
            setTimeout(() => {
                requestAnimationFrame(animate_a);

            }, speed);
        } else {
            //console.log('ff');


        }
        var minF = Infinity;
        var minIndx;
        for (var i = 0; i < pendingPoints.length; i++) {
            if (pendingPoints[i].f < minF) {
                minF = pendingPoints[i].f;
                minIndx = i;
            }
        }

        if (pendingPoints[minIndx].x == end.x && pendingPoints[minIndx].y == end.y) {
            //console.log('Done');
            end.showPath();

            animation_go_on = 0;
            DONE = 1;
            //window.cancelAnimationFrame(animate);
        }

        var current = pendingPoints[minIndx];
        //console.log(current);




        processedPoints.push(current);
        pendingPoints.splice(minIndx, 1);
        var currentNeigh = current.neightbours;
        //console.log(currentNeigh);

        for (var k = 0; k < currentNeigh.length; k++) {
            //console.log('here');

            var element = currentNeigh[k];
            if (processedPoints.includes(element) || element.obstacle) {
                //console.log('fff00');

                continue;
            }
            tentative_g = current.g + 1;
            //console.log(tentative_g);

            var a = (element.x - end.x);
            var b = (element.y - end.y);
            element.f = element.g + Math.sqrt(a * a + b * b);

            if (!pendingPoints.includes(element)) {
                if (tentative_g < element.g) {
                    element.g = tentative_g;
                    pendingPoints.push(element);
                } else {
                    pendingPoints.push(element);
                }

            }

            element.prev = current;


        }


    } else {
        console.log('Didn\'t Find');

    }
    //console.log('animating');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 500, 500);
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            if (grid[i][j].obstacle) {
                grid[i][j].show(obstacleColor)
            } else {
                grid[i][j].show(boardColor);
            }

        }
    }



    for (var j = 0; j < pendingPoints.length; j++) {
        pendingPoints[j].show(pendingColor);
    }

    for (var j = 0; j < processedPoints.length; j++) {
        processedPoints[j].show(processedColor);
    }

    if (DONE == 1) {
        for (var o = 0; o < final_path.length; o++) {
            //console.log(o, final_path[o]);


            final_path[o].show('blue');
        }
    }
}

function animate_d() {
    //dontAnimateBlank = 0;
    if (pendingPoints.length > 0) {
        //console.log(DONE);

        if (DONE != 1 && animation_go_on === 1) {
            setTimeout(() => {
                requestAnimationFrame(animate_d);
            }, speed);
        } else {
            //console.log('ff');

            return;
        }
        var minF = Infinity;
        var minIndx;
        for (var i = 0; i < pendingPoints.length; i++) {
            if (pendingPoints[i].f < minF) {
                minF = pendingPoints[i].f;
                minIndx = i;
            }
        }

        if (pendingPoints[minIndx].x == end.x && pendingPoints[minIndx].y == end.y) {
            //console.log('Done');
            //pendingPoints.splice(minIndx, 1);
            end.showPath();

            animation_go_on = 0;
            DONE = 1;
            //window.cancelAnimationFrame(animate);
        }

        var current = pendingPoints[minIndx];
        //console.log(current);




        processedPoints.push(current);
        pendingPoints.splice(minIndx, 1);
        var currentNeigh = current.neightbours;
        //console.log(currentNeigh);

        for (var k = 0; k < currentNeigh.length; k++) {
            //console.log('here');

            var element = currentNeigh[k];
            if (processedPoints.includes(element) || element.obstacle) {
                //console.log('fff00');

                continue;
            }
            tentative_g = current.g + 1;
            //console.log(tentative_g);


            element.f = element.g + 0;

            if (!pendingPoints.includes(element)) {
                if (tentative_g < element.g) {
                    element.g = tentative_g;
                    pendingPoints.push(element);
                } else {
                    pendingPoints.push(element);
                }

            }

            element.prev = current;


        }


    } else {
        if (DONE == 1) return;
        console.log('Didn\'t Find');

    }
    //console.log('animating');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 500, 500);
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            if (grid[i][j].obstacle) {
                grid[i][j].show(obstacleColor)
            } else {
                grid[i][j].show(boardColor);
            }

        }
    }



    for (var j = 0; j < pendingPoints.length; j++) {
        pendingPoints[j].show(pendingColor);
    }

    for (var j = 0; j < processedPoints.length; j++) {
        processedPoints[j].show(processedColor);
    }

    if (DONE == 1) {
        for (var o = 0; o < final_path.length; o++) {
            //console.log(o, final_path[o]);


            final_path[o].show('blue');
        }
    }
}





function a_star_start() {
    dontAnimateBlank = 1;
    speed = slider.value;
    //console.log(speed);
    
    a_star();
}

function stop_anim() {
    animation_go_on = 0;
}

function reset_board() {
    window.location.reload();
    
}

function animate_begin() {
    if (dontAnimateBlank != 1) {
        console.log('animating blank');

        requestAnimationFrame(animate_begin);
        c.fillStyle = 'white';
        c.fillRect(0, 0, 500, 500);
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (grid[i][j].obstacle) {
                    grid[i][j].show(obstacleColor)
                }else if(start == grid[i][j]) {
                    grid[i][j].show(startColor);
                }
                else if(end == grid[i][j]){
                    grid[i][j].show(endColor);
                }
                else {
                    grid[i][j].show(boardColor);
                }

            }
        }
    }
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

    if(select == 33) {
        select = 0;
        start = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(startColor);
    }else if(select == 66) {
        select = 0;
        end = grid[x - 1][y - 1];
        grid[x - 1][y - 1].show(endColor);
    }else {
        grid[x - 1][y - 1].obstacle = !grid[x - 1][y - 1].obstacle;
    }


});


