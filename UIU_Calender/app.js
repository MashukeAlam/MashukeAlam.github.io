console.log("Bismillah... Getting...");
const canvas = document.getElementById("cal");
const fps = 2;
var ctx = canvas.getContext("2d");
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const dayModuleWidth = 30;
const dayModuleHeight = 20;
const paddingAmongDays = 5;
const MonthInfo = [
    ["Jan", 4, 31],
    ["Feb", 0, 29],
    ["Mar", 1, 31],
    ["Apr", 4, 30],
    ["May", 6, 31],
    ["Jun", 2, 30],
    ["Jul", 4, 31],
    ["Aug", 0, 31],
    ["Sept", 3, 30],
    ["Oct", 5, 31],
    ["Nov", 1, 30],
    ["Dec", 3, 31]
];

function setFill() {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
}

function render() {
    setTimeout(() => {
        requestAnimationFrame(render);
    }, 1000 / fps);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var start = 0;
    var end = 10;
    var xExpand = 350;
    var yExpand = 300;

    for(var i = 0; i < 12; i++) {
        
        new Month(start, end).show(MonthInfo[i][0], MonthInfo[i][1], MonthInfo[i][2]);
        start += xExpand;

        if(i % 4 == 0 && i != 0) {
            start = 0;
            end += yExpand;
        }
    }
}

setFill();
render();
