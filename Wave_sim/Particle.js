//RAINDROP
class Particle {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.s = 500 / 2;
        this.dir = 1;
    }



    static setSpeed() {
        if (this.z > 10) {
            return rainDrop.getRandomInt(3);
        } else return rainDrop.getRandomInt(5) + 5;
    }



    show() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
    }

    jump(amplitude) {
        var downLow = this.s + amplitude;
        var highUp = this.s - amplitude;
        
        setTimeout(() => {
            if(this.y >= highUp && this.dir == 1) {
                this.y -= 10;
            } else {
                this.dir = 0;
            }
            
            if(this.y <= downLow && this.dir == 0) {
                this.y += 10;
            } else {
                this.dir = 1;
            }
        }, this.x * 10);
        
    }
}