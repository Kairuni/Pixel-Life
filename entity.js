function Entity(game, pos, dim) {
    this.game = game;
    this.x = pos.x;
    this.y = pos.y;
    this.w = dim.w;
    this.h = dim.h;
    this.removeFromWorld = false;

    this.entityType = 0;
}

Entity.prototype.collide = function(otherEntity) {
    if (this.x - (this.w / 2) > otherEntity.x + (otherEntity.w / 2) ||
        this.x + (this.w / 2) < otherEntity.x - (otherEntity.w / 2) ||
        this.y + (this.h / 2) < otherEntity.y - (otherEntity.h / 2) ||
        this.y - (this.h / 2) > otherEntity.y + (otherEntity.h / 2))
        return false;
    else
        return true;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
}
