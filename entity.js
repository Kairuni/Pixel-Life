function Entity(game, pos, rad) {
    this.game = game;
    this.x = pos.x;
    this.y = pos.y;
    this.radius = rad;
    this.removeFromWorld = false;

    this.entityType = 0;
}

Entity.prototype.collide = function(otherEntity) {
    var deltaX = otherEntity.x - this.x;
    var deltaY = otherEntity.y - this.y;
    var radii = otherEntity.radius + this.radius;
    return deltaX * deltaX + deltaY * deltaY < radii * radii;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
}
