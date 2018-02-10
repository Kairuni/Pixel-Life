class Effect extends Entity {
    constructor(game, pos, symbol, color, alive) {
        super(game, pos, 0);
        this.symbol = symbol;
        this.color = color;
        if (!alive)
            this.aliveFor = .2;
        else
            this.aliveFor = alive;
            
        if (game)
            game.addEntity(this);
    }

    update() {
        this.aliveFor -= this.game.clockTick;
        if (this.aliveFor <= 0)
            this.removeFromWorld = true;
    }

    draw(ctx) {
        var colorStr = "rgb(" + this.color.r + ", " + this.color.g + ", " + this.color.b + ")";
        ctx.font = "16px Arial";
        ctx.fillStyle = colorStr;
        ctx.fillText(this.symbol, this.x, this.y);
    }
}
