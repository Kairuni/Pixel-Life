class levelPartitioner {
    constructor(levelDims, gridSize) {
        this.grid = [];
        for (var x = 0; x < levelDims.x / gridSize; x++) {
            this.grid[x] = [];
            for (var y = 0; y < levelDims.y / gridSize; y++) {
                this.grid[x][y] = {bullets: [], ships: [], walls: []};
            }
        }
        this.gridDims = {x: levelDims.x / gridSize, y: levelDims.y / gridSize};
        this.gridSize = gridSize;
    }

    getBounds(entity) {
        var bounds = {
            x1: Math.floor((entity.x - (entity.w / 2)) / this.gridSize),
            x2: Math.floor((entity.x + (entity.w / 2)) / this.gridSize),
            y1: Math.floor((entity.y - (entity.h / 2)) / this.gridSize),
            y2: Math.floor((entity.y + (entity.h / 2)) / this.gridSize)
        };

        // Limit the box to 'within the grid.'
        // Some people hate ternary statements, so all this is is : if x1 is < 0, set it to 0, if x2 > grimDims.x, set it to grimDims.x.
        // Same for y, respectively.
        bounds.x1 = (bounds.x1 >= 0) ? bounds.x1 : 0;
        bounds.y1 = (bounds.y1 >= 0) ? bounds.y1 : 0;
        bounds.x2 = (bounds.x2 <= this.gridDims.x) ? bounds.x2 : this.gridDims.x;
        bounds.y2 = (bounds.y2 <= this.gridDims.y) ? bounds.y2 : this.gridDims.y;

        return bounds;
    }

    removeFromGrid(entity, type = 2) {
        var bounds = this.getBounds(entity);

        var key = "bullets";
        if (type === 1)
            key = "ships";

        for (var x = bounds.x1; x <= bounds.x2; x++) {
            for (var y = bounds.y1; y <= bounds.y2; y++) {
                if (!this.grid[x] || !this.grid[x][y])
                    continue;

                var index = this.grid[x][y][key].indexOf(entity);
                if (index > -1) {
                    this.grid[x][y][key].splice(index, 1);
                    //console.log("Removed " + entity.constructor.name + " from grid " + key + ".");
                }
            }
        }
    }

    addToGrid(entity, type = 0) {
        var bounds = this.getBounds(entity);
        var walls = type === 0;
        var ships = type === 1;
        var bullets = type === 2;

        if (type === 0)
            console.log(bounds);

        for (var x = bounds.x1; x <= bounds.x2; x++) {
            for (var y = bounds.y1; y <= bounds.y2; y++) {
                //console.log(x + " | " + y);
                if (!this.grid[x] || !this.grid[x][y])
                    continue;

                if (ships) {
                    this.grid[x][y].ships.push(entity);
                } else if (bullets) {
                    this.grid[x][y].bullets.push(entity);
                } else if (walls) {
                    console.log("Added a wall to the grid.");
                    this.grid[x][y].walls.push(entity);
                }
            }
        }
    }

    // Test for collisions.
    // Returns: map of collisions for each entity class.
    testCollide(entity, test = {ship: true, wall: true, bullet: true}) {
        var bounds = this.getBounds(entity);

        var collisions = {
            ship: [],
            wall: [],
            bullet: [],
        }

        var result = false;

        for (var x = bounds.x1; x <= bounds.x2; x++) {
            for (var y = bounds.y1; y <= bounds.y2; y++) {
                //console.log(x + " | " + y);
                if (!this.grid[x] || !this.grid[x][y])
                    continue;

                var ships = this.grid[x][y].ships;
                var bullets = this.grid[x][y].bullets;
                var walls = this.grid[x][y].walls;

                for (var i = 0; i < Math.max(ships.length, bullets.length, walls.length); i++) {
                    if (test.ship && i < ships.length && i < ships[i].collide(entity) && collisions.ship.indexOf(ships[i]) == -1) {
                        collisions.ship.push(ships[i]);
                    }
                    if (test.wall && i < walls.length && i < walls[i].collide(entity) && collisions.wall.indexOf(walls[i]) == -1) {
                        collisions.wall.push(walls[i]);
                    }
                    if (test.bullet && i < bullets.length && i < bullets[i].collide(entity) && collisions.bullet.indexOf(bullets[i]) == -1) {
                        collisions.bullet.push(bullets[i]);
                    }
                }
            }
        }
        return collisions;
    }
}
