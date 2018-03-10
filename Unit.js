const UNIT_RADIUS = 4;
const HUNGER_LIMIT = 120;
const MUTATE_FACTOR = 0.00005;
const BASE_BUFF_MAX = 3;
const HERBIVORE_ATK = 3;
const BASE_VEL = 75;
const BASE_ATK = 10;
const BASE_DEF = 5;
const BASE_HP = 10;
const RANDOM_DIR_SHIFT = 1;
const BREED_CD = 5;
const HUNGER_MULTIPLIER = 2;
const SIGHT_RADIUS = 100;
const MAX_SIGHT_ANGLE = 3.1415 / 6;

function buildBasicFactionColors(game) {
    // Build faction colors for 'herbivore wildlife', 'carnivore wildlife'
    game.factionColors[0] = {r: 50, g: 200, b: 100};
    game.factionColors[1] = {r: 255, g: 28, b: 0};
}

class Unit extends movingObject {
    constructor(game, pos, faction) {
        super(game, pos, UNIT_RADIUS);

        this.entityType = 1;
        this.dir = Math.random() * 2 * 3.1415;

        // SURVIVAL STATS
        this.vel = BASE_VEL + (Math.random() * BASE_BUFF_MAX);
        this.faction = faction;
        if (!game.factionCount[faction])
            game.factionCount[faction] = 0;
        game.factionCount[faction] += 1;
        this.food = 100.0;
        this.atk = BASE_ATK + (Math.random() * BASE_BUFF_MAX);
        this.def = BASE_DEF + (Math.random() * BASE_BUFF_MAX);
        this.mhp = BASE_HP + (Math.random() * BASE_BUFF_MAX);
        this.hp = this.mhp;

        this.recentlyBred = 0;
        this.breedCooldown = BREED_CD;

        this.collidedWith = [];
        this.saw = [];

        this.isChild = 0;

        this.doLook = Math.random() * 30;

        this.sight = SIGHT_RADIUS + (Math.random() * BASE_BUFF_MAX);

        if (faction == 0) {
            this.atk = HERBIVORE_ATK + (Math.random() * BASE_BUFF_MAX);
            this.sight = 3.1415 * .8;
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

        // Test for close range collisions
        var collisions = this.game.partitioner.testCollide(this, colTest);
        this.handleNearCollisions(collisions);

        // Test for sight collisions
        if (this.doLook > 30) {
            this.radius = this.sight;
            var collisions = this.game.partitioner.testCollide(this, colTest);
            //console.log(collisions);
            this.handleSightCollisions(collisions);
            this.radius = UNIT_RADIUS;
            this.doLook = -1;
        }
        this.doLook += 1;

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
        this.saw = [];

        this.checkDeath();

        // Hardcoding this for now:
        if (this.x < 0) {
            this.x = RES_X;
        } else if (this.x > RES_X) {
            this.x = 0;
        }
        if (this.y < 0) {
            this.y = RES_Y;
        } else if (this.y > RES_Y) {
            this.y = 0;
        }
    }

    handleSightCollisions(collisions) {
        for (var i = 0; i < collisions.ship.length; i++) {
            // If we have not collided with the other entity
            //console.log("In sight col?");
            if (this.saw.indexOf(collisions.ship[i]) == -1) {

                var other = collisions.ship[i];

                var angleToOther = Math.atan2(other.x - this.x, this.y - other.y) - (3.1415/2);

                var diff = (this.dir - angleToOther);

                if (Math.abs(diff) <= this.sight) {
                    if (other.faction == this.faction && this.food >= 60 && !other.isChild && !this.isChild && this.recentlyBred <= 0 && other.recentlyBred <= 0) {
                        this.dir = angleToOther;
                    } else if (other.faction != this.faction && this.faction == 0) {
                        // Run away if herbivore
                        this.dir = angleToOther + 3.1415;
                    } else if (other.faction != this.faction && this.food <= HUNGER_LIMIT) {
                        this.dir = angleToOther;
                    }
                }
            }
        }
    }

    handleNearCollisions(collisions) {
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

                /*if (changeDir) {
                    this.dir += 3.1415 - RANDOM_DIR_SHIFT + 2 * Math.random() * RANDOM_DIR_SHIFT;;
                    other.dir += 3.1415 - RANDOM_DIR_SHIFT + 2 * Math.random() * RANDOM_DIR_SHIFT;
                }*/
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

            if (this.faction != 0)
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
        ctx.fillRect(this.x, this.y, this.radius + 1, this.radius + 1);
    }
}
