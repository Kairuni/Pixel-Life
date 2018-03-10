// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.staticEntities = [];
    this.showOutlines = false;
    this.ctx = null;
    this.click = null;
    this.mouse = {x: 0, y: 0};
    this.wheel = null;
    this.factionCount = [];
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.factionColors = [];
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;

    ctx.imageSmoothingEnabled = false;

    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');
    var that = this;

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        return { x: x, y: y };
    }

    this.ctx.canvas.addEventListener("keydown", function (e) {
        if (String.fromCharCode(e.which) === 'W') that.up = true;
        else if (String.fromCharCode(e.which) === 'A') that.left = true;
        else if (String.fromCharCode(e.which) === 'S') that.down = true;
        else if (String.fromCharCode(e.which) === 'D') that.right = true;
        //console.log(String.fromCharCode(e.which));
        //console.log(e);
        //console.log(that.up);
        //e.preventDefault();
    }, false);

    this.ctx.canvas.addEventListener("keyup", function (e) {
        if (String.fromCharCode(e.which) === 'W') that.up = false;
        else if (String.fromCharCode(e.which) === 'A') that.left = false;
        else if (String.fromCharCode(e.which) === 'S') that.down = false;
        else if (String.fromCharCode(e.which) === 'D') that.right = false;
        //console.log(String.fromCharCode(e.which));
        //console.log(e);
        //console.log(that.up);
        //e.preventDefault();
    }, false);


    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
        //console.log(e);
    }, false);

    this.ctx.canvas.addEventListener("mousedown", function (e) {
        that.click = true;
    }, false);

    this.ctx.canvas.addEventListener("mouseup", function (e) {
        that.click = false;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    //console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.addStaticEntity = function (entity) {
    console.log('added static entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.staticEntities.length; i++) {
        this.staticEntities[i].draw(this.ctx);
    }
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {


    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        } else {
            if (this.partitioner)
                this.partitioner.removeFromGrid(entity, entity.entityType);
            this.entities.splice(i, 1);
            i--;
            entitiesCount--;
        }
    }
}

GameEngine.prototype.loop = function () {
    //console.log("Pre: " + this.timer.gameTime);
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.space = null;
//    console.log("Post: " + this.timer.gameTime);
}

GameEngine.prototype.tData = function(x, y) {

    return 0;
}
