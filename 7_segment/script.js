const canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 500;
let FPS = 100;
const color_back = '#000';
var ci = 0;
const colors = ['red', 'green', 'yellow', 'orange'];
var segmentColor = colors[ci];
var k = 0;
var one = {
    1: 0,
    2: 0,
    3: 0,
    4: 1,
    5: 0,
    6: 1,
    7: 0
}
var two = {
    1: 1,
    2: 0,
    3: 1,
    4: 1,
    5: 1,
    6: 0,
    7: 1
}
var three = {
    1: 1,
    2: 0,
    3: 1,
    4: 1,
    5: 0,
    6: 1,
    7: 1
}
var four = {
    1: 0,
    2: 1,
    3: 1,
    4: 1,
    5: 0,
    6: 1,
    7: 0
}
var five = {
    1: 1,
    2: 1,
    3: 1,
    4: 0,
    5: 0,
    6: 1,
    7: 1
}
var six = {
    1: 1,
    2: 1,
    3: 1,
    4: 0,
    5: 1,
    6: 1,
    7: 1
}
var seven = {
    1: 1,
    2: 0,
    3: 0,
    4: 1,
    5: 0,
    6: 1,
    7: 0
}

var eight = {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1
}
var nine = {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 0,
    6: 1,
    7: 1
}

var zero = {
    1: 1,
    2: 1,
    3: 0,
    4: 1,
    5: 1,
    6: 1,
    7: 1
}

var design = [];
design.push(one);
design.push(two);
design.push(three);
design.push(four);
design.push(five);
design.push(six);
design.push(seven);
design.push(eight);
design.push(nine);
design.push(zero);

class Segment {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    debugShow(active) {
        if (active == 1) {
            ctx.fillStyle = segmentColor;
            ctx.fillRect(this.x1, this.y1, this.x2, this.y2);
        } else {
            ctx.strokeStyle = segmentColor;
            ctx.strokeRect(this.x1, this.y1, this.x2, this.y2);
        }
    }
}


class SegmentSet {
    constructor(i) {

        this.seg1 = new Segment(i+10, 10, 40, 10);
        this.seg2 = new Segment(i+10, 10, 10, 40);
        this.seg3 = new Segment(i+10, 40, 40, 10);
        this.seg4 = new Segment(i+40, 10, 10, 40);
        this.seg5 = new Segment(i+10, 40, 10, 40);
        this.seg6 = new Segment(i+40, 40, 10, 40);
        this.seg7 = new Segment(i+10, 70, 40, 10);
        //, this.seg5, this.seg6, this.seg7
        //this.sevens = [this.seg1, this.seg2, this.seg3, this.seg4];
        this.sevens = [];
        this.sevens.push(this.seg1);
        this.sevens.push(this.seg2);
        this.sevens.push(this.seg3);
        this.sevens.push(this.seg4);
        this.sevens.push(this.seg5);
        this.sevens.push(this.seg6);
        this.sevens.push(this.seg7);
    }

    show(num) {
        for (var i = 0; i < 7; i++) {
            this.sevens[i].debugShow(num[i + 1]);
        }
    }

}


function render() {
    id = setTimeout(function () {
        requestAnimationFrame(render);
    }, 1000 / 1);
    ctx.fillStyle = color_back;
    ctx.fillRect(0, 0, 500, 500);
    
    new SegmentSet(0).show(design[k++%10]);
    new SegmentSet(60).show(design[k++%10]);
    new SegmentSet(120).show(design[k++%10]);
    new SegmentSet(180).show(design[k++%10]);
    new SegmentSet(240).show(design[k++%10]);
    new SegmentSet(300).show(design[k++%10]);
    //console.log(now, design[now]);


}

function color() {
    segmentColor = colors[ci++ % colors.length];
}

render();