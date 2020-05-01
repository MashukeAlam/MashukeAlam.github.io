console.log('Alhamdulillah');

const canvas = document.getElementById("canvas");

var ctx = canvas.getContext("2d");

const OFFSET = 3;
var fileName = "";

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r, text, color) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    r *= .7;
    var txtColor, bgColor, sharpLeft, sharpRight;
    if(color === "yw") {
        txtColor = "black";
        bgColor = "#ff9801";
        sharpLeft = 0;
        sharpRight = r;
    } else {
        txtColor = "white";
        bgColor = "black";
        sharpRight = 0;
        sharpLeft = r;
    }

    

    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, sharpRight);
    this.arcTo(x+w, y+h, x,   y+h, sharpRight);
    this.arcTo(x,   y+h, x,   y,   sharpLeft);
    this.arcTo(x,   y,   x+w, y,   sharpLeft);
    this.closePath();
    ctx.fillStyle = bgColor;
    this.fill()
    ctx.font = "bolder 40px Segoe UI"; 
    ctx.fillStyle = txtColor;
    ctx.fillText(text, x + 2, y + (h * 0.5) + 12);
}



const process = () => {
    // ctx.fillStyle = "white";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    var fn = document.getElementById('fname').value;
    var ln = document.getElementById('lname').value;
    fn = capitalizeFirst(fn);
    ln = capitalizeFirst(ln);
    var firstWidth = determineLen(fn);
    var lastWidth = determineLen(ln);
    canvas.width = firstWidth + lastWidth;
    canvas.height = 40
    ctx.roundRect(0, 0, firstWidth, 40, 5, fn, "bw");
    ctx.roundRect(firstWidth, 0, lastWidth, 40, 5, ln, "yw");
    document.getElementById('btnDl').style.display = "block";
    fileName = fn + ln + '.png';
}

const determineLen = (str) => {
    ctx.font = "bolder 40px Segoe UI";
    return Math.ceil(ctx.measureText(str).width) + OFFSET;
}



var download = function(){
  var link = document.createElement('a');
  link.download = fileName;
  link.href = document.getElementById('canvas').toDataURL();
  link.click();
}

const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
