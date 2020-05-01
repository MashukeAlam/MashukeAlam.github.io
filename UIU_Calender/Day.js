class Day {

    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    show(txt) {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y, 40, 30);
        ctx.font = "20px Comic Sans MS";
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.fillText(txt, this.x + 20, this.y + 20);
    }

}