//RAINDROP
class rainDrop {

    constructor(color) {
        this.x =  rainDrop.getRandomInt(window.innerWidth);
        this.y = rainDrop.getRandomInt(window.innerHeight);
        this.z = rainDrop.getRandomInt(20);
        this.thickness = rainDrop.setThickness();
        this.yspeed = rainDrop.setSpeed();
        this.xspeed = 0;
        this.color = color;
        this.bank = 0;
    }

    static setThickness() {
        if(this.z > 10) {
            return rainDrop.getRandomInt(1);
        }else return rainDrop.getRandomInt(3) + 1;
    }

    static setSpeed() {
        if(this.z > 10) {
            return rainDrop.getRandomInt(3);
        }else return rainDrop.getRandomInt(5) + 5;
    }
    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    show(dir) {
        this.updateAngle(dir);
        ctx.beginPath();
        ctx.lineWidth = this.thickness;
        ctx.moveTo(this.x, this.y);
        
        ctx.lineTo(this.x + this.bank, this.y + 30);
        
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }

    updateAngle(dir) {
        if(dir == 'R') {
            if(this.bank < 15) {
                this.bank += 0.1;
            }
            //console.log(this.bank);
            
            this.xspeed = rainDrop.setSpeed();
        }else if(dir == 'L') {
            if(this.bank > -15) {
                this.bank -= 0.1;
            }
            this.xspeed = rainDrop.setSpeed();
        }
    }

    fall() {
        this.y += 10;
        this.x += this.xspeed;
        //console.log(this.yspeed, this.xspeed);
        
        if(this.y > window.innerHeight) {
            this.y = rainDrop.getRandomInt(window.innerHeight);
        } 
         if(this.x > window.innerWidth || this.x < window.innerWidth) {
             this.x = rainDrop.getRandomInt(window.innerWidth);
             //console.log(this.x);
            
        } 
    }
}


