var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', {preload: preload, create: create, update: update});

var player;
var map;
var ladderMap;
var platforms;
var ladders;
var stoppers;
var npcs;

function preload() {
    // preload content
    game.load.image('tilesheet', 'assets/tileset.png');
    game.load.image('player', 'assets/player.png');
    game.load.spritesheet('NPC', 'assets/NPC.png', 10, 16);
    game.load.tilemap('map', 'assets/maps/level.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    // create entities
    game.stage.backgroundColor = '#47A3FF'; 
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 1920, 1920);
    game.physics.arcade.gravity.y = 600;

    var text = game.add.text(32, 32, 'GREG IS HAPPY', {fontSize:'64px', fill: '#000'});
    text.anchor.set(0.5);
    text.x = game.width / 2;
    text.y = game.height / 4;

    map = game.add.tilemap('map');
    map.addTilesetImage('tileset', 'tilesheet');
    map.setCollisionBetween(1, 4);

    platforms = map.createLayer('Platforms'); 
    ladders = map.createLayer('Ladders');
    stoppers = map.createLayer('Stoppers');
    stoppers.visible = false;

    cursors = game.input.keyboard.createCursorKeys();

    npcs = game.add.group();
    npcs.enableBody = true;
    var max = 5;
    var total = 0;
    var tiles = platforms.getTiles(0, 0, platforms.width, platforms.height);
    for (var i in tiles) {
        if (total >= max) {
            break;
        }

        if (i % 10 === 0) {
            total = 0;
        }

        var tile = tiles[i];
        if (tile.index == 3 && Math.random() > 0.9) {
            npc = new NPC(tile.worldX, 0);
            npc.y = tile.worldY - npc.height;
            npcs.add(npc);
            total += 1; 
            if (total == 2) {
                break;
            }
         }
    }

    player = new Player();
    game.add.existing(player);
    game.camera.follow(player);
}

function update() {
    game.physics.arcade.collide(player, platforms); 
    game.physics.arcade.collide(npcs, platforms); 
    npcs.forEach(function(npc) {
        game.physics.arcade.overlap(npc, npcs, npcOverlap);
    });
}

function npcOverlap(npc1, npc2) {
    if (npc1.renderOrderID == npc2.renderOrderID) {
        return;
    }
    var rager;
    var victim;
    if (Math.random() <= 0.5) {
        rager = npc1;
        victim = npc2;
    } else {
        rager = npc2;
        victim = npc1;
    }
    // higher anger, higher chance of rage
    var chance = (rager.anger * 0.05) - 0.3;
    if (Math.random() >= chance) {
        rager.rageAt(victim);
    }
}

Player = function() {
    Phaser.Sprite.call(this, game, 0, 0, 'player');
    game.physics.arcade.enable(this);
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function() {
    this.body.velocity.x = 0;
    if (cursors.left.isDown) {
        this.body.velocity.x = -350;
    }else if (cursors.right.isDown) {
        this.body.velocity.x = 350;
    } 

    if (cursors.up.isDown && this.body.onFloor()) {
        this.body.velocity.y = -300;
    }
};

NPC = function(x, y) {
    Phaser.Sprite.call(this, game, x, y, 'NPC');
    game.physics.arcade.enable(this);
     
    this.lastRaged = this.game.time.now - 100;
    this.anger = 0;

    this.body.velocity.x = 50;
    if (Math.random() > 0.5) {
        this.body.velocity.x *= -1;
    }
};

NPC.prototype = Object.create(Phaser.Sprite.prototype);
NPC.prototype.contstructor = NPC;

NPC.prototype.update = function() {
    // anger management
    if (this.anger < 9) { 
        this.anger += game.time.physicsElapsed;
    }

    this.frame = Math.round(this.anger);
    if (Math.round(this.anger) > 9) {
        this.frame = 9;
    }

    // edge detection
    var tileX = stoppers.getTileX(this.x + this.body.width/2);
    var tileY = stoppers.getTileY(this.y + this.body.height/2);
    if (this.isEdge(stoppers.index, tileX, tileY)) {
        if (this.game.time.now - this.lastTime < 100) {
            return;
        }

        this.body.velocity.x *= -1;
        this.lastTime = this.game.time.now;
        /*
        if (this.animations.currentAnim.name == 'left') {
            this.animations.play('right');
            return;
        }
        
        this.animations.play('left');*/
    }
};

NPC.prototype.isEdge = function(index, x, y) {
    var leftTile = map.getTileLeft(index, x, y);
    var rightTile = map.getTileRight(index, x, y);
   
    if (!leftTile && rightTile) {
        return rightTile.index != -1;
    }

    if (!rightTile && leftTile) {
        return leftTile.index != -1;
    }

    return (leftTile.index != -1) || (rightTile.index != -1);
};

NPC.prototype.rageAt = function(otherNPC) {
    // TODO - implement different levels of rage
    if (this.game.time.now - this.lastRaged < 1000) {
        console.log("no rage");
        return;
    }

    otherNPC.anger *= 1.5;
    console.log("RAAAGE");
    this.lastRaged = otherNPC.lastRaged = this.game.time.now;
};

