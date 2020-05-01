class Month {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
    }

    show(txt, day, total) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x, this.y, 315, 30);
        var X = this.x;
        var Y = this.y + 35;

        for (var i = 1; i < 8; i++) {
            new Day(X, Y, "white").show(this.days[i-1]);
            X += 45;
        }

        X = this.x + day * 45;
        Y += 35;

        for (var i = 1; i <= total; i++) {
            var color = ((i + day) % 7 == 0 || (i + day) % 7 == 1) ? 'red' : 'white';
            new Day(X, Y, color).show(i);
            X += 45;
            if (X % 7 === 0) {
                Y += 35;
                X = this.x;
            }
        }

        ctx.font = "20px Comic Sans MS";
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(txt, this.x + 315/2, this.y + 20);

    }
}
