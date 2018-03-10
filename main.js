const RES_X = window.innerWidth;
const RES_Y = window.innerHeight;
const BASE_SPAWN = 500;

const RANDOM_CHANCE = 0.01;

function Background(game) {
    Entity.call(this, game, 0, 400);
    this.cPos = 0;
}

Background.prototype = new Entity(null, [0,0], [0,0]);
Background.prototype.constructor = Background;

Background.prototype.draw = function (ctx) {
    ctx.drawImage(ASSET_MANAGER.getAsset("./World.png"), 0, 0);
}

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./World.png");
ASSET_MANAGER.queueDownload("./WorldTransitMap.png");

ASSET_MANAGER.downloadAll(function () {
    var canvas = document.getElementById('gameWorld');
    canvas.width = window.innerWidth - 30;
    canvas.height = window.innerHeight - 30;

    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    gameEngine.partitioner = new levelPartitioner({x: RES_X, y: RES_Y}, 20);


    //var bg = new Background(gameEngine, {x: 0, y: 0}, {w: 0, h: 0});
    //gameEngine.addStaticEntity(bg);

    count = 0;

    for (var x = 0; x < RES_X; x += 4) {
        for (var y = 0; y < RES_Y; y += 4) {
            var rnd = Math.random();

            if (rnd < RANDOM_CHANCE) {
                new Unit(gameEngine, {'x': x, 'y': y}, 0);
                count++;
            } else if (rnd >= RANDOM_CHANCE && rnd <= 1.3 * RANDOM_CHANCE) {
                new Unit(gameEngine, {'x': x, 'y': y}, 1);
                count++;
            } else if (rnd >= RANDOM_CHANCE * 1.3 && rnd <= 1.5 * RANDOM_CHANCE) {
                new Unit(gameEngine, {'x': x, 'y': y}, 2);
                count++;
            }
            if (count > BASE_SPAWN)
                break;
        }
        //console.log(count);

        if (count > BASE_SPAWN)
            break;

        // console.log("One row down.");
    }

    gameEngine.init(ctx);
    gameEngine.start();
});
