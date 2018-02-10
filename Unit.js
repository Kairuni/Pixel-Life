const SCALE_FACTOR = 2;
const UNIT_RADIUS = 2;
const HUNGER_LIMIT = 120;
const MUTATE_FACTOR = 0.00005;
const HERBIVORE_ATK = 3;
const BASE_VEL = 75;
const BASE_ATK = 10;
const BASE_DEF = 5;
const BASE_HP = 10;
const RANDOM_DIR_SHIFT = 1;
const BREED_CD = 5;
const HUNGER_MULTIPLIER = 2;

function buildBasicFactionColors(game) {
    // Build faction colors for 'herbivore wildlife', 'carnivore wildlife'
    game.factionColors[0] = {r: 50, g: 200, b: 100};
    game.factionColors[1] = {r: 255, g: 28, b: 0};
}

class Unit extends movingObject {
    constructor(game, pos, faction) {
        super(game, pos, UNIT_RADIUS, BASE_VEL);

        this.entityType = 1;
        this.dir = Math.random() * 2 * 3.1415;

        // SURVIVAL STATS
        this.vel = BASE_VEL;
        this.faction = faction;
        if (!game.factionCount[faction])
            game.factionCount[faction] = 0;
        game.factionCount[faction] += 1;
        this.food = 100.0;
        this.atk = BASE_ATK;
        this.def = BASE_DEF;
        this.mhp = BASE_HP;
        this.hp = this.mhp;

        this.recentlyBred = 0;
        this.breedCooldown = BREED_CD;

        this.collidedWith = [];

        this.isChild = 0;

        if (faction == 0) {
            this.atk = Math.random() * HERBIVORE_ATK;
        }

        if ((faction == 0 || faction == 1) && !this.game.factionColors[faction]) {
            buildBasicFactionColors(game);
        }
        if (!game.factionColors[faction]) {
            game.factionColors[faction] = {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 50), b: 100 + Math.floor(Math.random() * 155)};
        }
    }



    update(colTest = {ship: true, wall: false, bullet: false}) {
        // Remove from partitioner
        this.game.partitioner.removeFromGrid(this, this.entityType);

        this.xVel = this.vel * Math.cos(this.dir) * (this.food / 100.0);
        this.yVel = this.vel * Math.sin(this.dir) * (this.food / 100.0);

        this.x += this.xVel * this.game.clockTick;
        this.y += this.yVel * this.game.clockTick;

        // Test for collisions
        var collisions = this.game.partitioner.testCollide(this, colTest);

        this.handleCollisions(collisions);

        // Add back to partitioner
        this.game.partitioner.addToGrid(this, this.entityType);

        this.prevX = this.x;
        this.prevY = this.y;

        // Make this object more hungry, unless it's an herbivore
        if (this.faction != 0)
            this.food -= this.game.clockTick * HUNGER_MULTIPLIER;

        if (this.isChild >= 0)
            this.isChild -= this.game.clockTick;

        if (this.recentlyBred >= 0)
            this.recentlyBred -= this.game.clockTick;

        this.collidedWith = [];

        // Test if we need to change direction.
        //this.game.tData((this.x + this.xVel) / SCALE_FACTOR, (this.y + this.yVel) / SCALE_FACTOR);
        this.dir = this.dir - 0.05 * RANDOM_DIR_SHIFT + 0.05 * 2 * Math.random() * RANDOM_DIR_SHIFT;;

        this.checkDeath();

        // Hardcoding this for now:
        if (this.x < 0) {
            this.x = RES_X * SCALE_FACTOR;
        } else if (this.x > RES_X * SCALE_FACTOR) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = RES_Y * SCALE_FACTOR;
        } else if (this.y > RES_Y * SCALE_FACTOR) {
            this.y = 0;
        }
    }

    handleCollisions(collisions) {
        for (var i = 0; i < collisions.ship.length; i++) {
            // If we have not collided with the other entity
            if (this.collidedWith.indexOf(collisions.ship[i]) == -1) {
                var changeDir = false;

                var other = collisions.ship[i];
                // If we encounter another unit of our faction and our hunger is >= 50, produce a new unit and set off in opposite directions.
                if (other.faction == this.faction) {
                    if (other.food >= 50 && this.food >= 50 && collisions.ship.length <= 3 && other.isChild <= 0 && this.recentlyBred <= 0 && other.recentlyBred <= 0) {
                        this.Breed(other);
                        changeDir = true;
                    }
                } else {
                    this.Attack(other);
                    other.Attack(this);
                    this.checkDeath();
                    other.checkDeath();
                    changeDir = true;
                }

                if (changeDir) {
                    this.dir += 3.1415 - RANDOM_DIR_SHIFT + 2 * Math.random() * RANDOM_DIR_SHIFT;;
                    other.dir += 3.1415 - RANDOM_DIR_SHIFT + 2 * Math.random() * RANDOM_DIR_SHIFT;
                }
            }

            this.collidedWith.push(collisions.ship[i]);
            collisions.ship[i].collidedWith.push(this);
        }
    }

    Attack(other) {
        var dmg = this.atk - other.def;

        if (dmg > 0 && this.food <= HUNGER_LIMIT) {
            //console.log("Unit of " + this.faction + " attacked unit of " + other.faction + " for " + dmg);
            new Effect(this.game, {'x': this.x, 'y': this.y}, "**", this.game.factionColors[this.faction], .75);
            other.hp -= dmg;

            this.food += other.food;
        }
    }

    checkDeath() {
        if (this.hp <= 0 || this.food <= 0) {
            this.game.factionCount[this.faction] -= 1;
            this.destroy();
        }

        if (this.hp <= 0) {
            //console.log("Unit of faction " + this.faction + " died in combat.");
            new Effect(this.game, {'x': this.x, 'y': this.y}, "C", this.game.factionColors[this.faction], 1);
        } else if (this.food <= 0) {
            console.log("Unit of faction " + this.faction + " died of starvation.");
            new Effect(this.game, {'x': this.x, 'y': this.y}, "S", this.game.factionColors[this.faction], 1);
        }

    }

    Breed(other) {
        var child = new Unit(this.game, {x: this.x, y: this.y}, this.faction);
        child.vel = this.vel - MUTATE_FACTOR + Math.random() * 2 * MUTATE_FACTOR;
        child.faction = this.faction;
        child.atk = this.atk - MUTATE_FACTOR + Math.random() * 2 * MUTATE_FACTOR;
        child.def = this.def - MUTATE_FACTOR + Math.random() * 2 * MUTATE_FACTOR;
        child.hp = child.mhp = this.mhp - MUTATE_FACTOR + Math.random() * 2 * MUTATE_FACTOR;
        child.breedCooldown = this.breedCooldown - MUTATE_FACTOR + Math.random() * 2 * MUTATE_FACTOR;
        child.isChild = 20;

        this.food -= 30;
        this.recentlyBred = this.breedCooldown;
        other.food -= 30;
        other.recentlyBred = this.breedCooldown;

        new Effect(this.game, {'x': this.x, 'y': this.y}, "+", this.game.factionColors[this.faction], .5);
        //console.log("Units of faction " + this.faction + " bred.");
    }

    draw(ctx) {
        var color = this.game.factionColors[this.faction];
        var colorStr = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
        ctx.fillStyle = colorStr;
        //if (this.faction > 1)
        //    console.log(color);
        //ctx.fillStyle = "black";
        //ctx.fillRect(Math.floor(this.x / SCALE_FACTOR) - this.radius, Math.floor(this.y / SCALE_FACTOR) - this.radius, (this.radius * 2) / SCALE_FACTOR, (this.radius * 2) / SCALE_FACTOR);
        ctx.fillRect(this.x, this.y, this.radius + 1, this.radius + 1);
    }
}