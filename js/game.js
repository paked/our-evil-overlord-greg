var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', {preload: preload, create: create, update: update});

var player;
var map;
var ladderMap;
var platforms;
var ladders;
var stoppers;
var stars;
var npcs;
var rc;
var spaceKey;
var greg;
var messages;

function preload() {
    // preload content
    game.load.image('tilesheet', 'assets/tileset.png');
    game.load.image('star', 'assets/star.png');
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

    greg = game.add.text(32, 32, 'GREG IS HAPPY', {fontSize:'64px', fill: '#000'});
    greg.anchor.set(0.5);
    greg.x = game.width / 2;
    greg.y = game.height / 4;

    map = game.add.tilemap('map');
    map.addTilesetImage('tileset', 'tilesheet');
    map.setCollisionBetween(1, 4);

    platforms = map.createLayer('Platforms'); 
    ladders = map.createLayer('Ladders');
    stoppers = map.createLayer('Stoppers');
    stoppers.visible = false;

    cursors = game.input.keyboard.createCursorKeys();
    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    npcs = game.add.group();
    npcs.enableBody = true;
    var max = 5;
    var total = 0;
    var tiles = platforms.getTiles(0, 0, platforms.width, platforms.height);
    for (var i in tiles) {
        var tile = tiles[i];
        if (tile.index == 3 && Math.random() > 0.9) {
            npc = new NPC(tile.worldX, 0);
            npc.y = tile.worldY - npc.height;
            npcs.add(npc);
            total += 1; 
         }
    }

    stars = game.add.group();
    i = 0;
    npcs.forEach(function(npc) {
        if (i % 2 === 0) {
            i++;
            return;
        }

        var star = new Star();
        var modX = Math.random() * 50;
        if (Math.random() > 0.5) {
            modX *= -1;
        }
        star.x = npc.x + modX;
        star.y = npc.y;

        stars.add(star);
        i++;
    });

    player = new Player();
    game.add.existing(player);
    game.camera.follow(player);

    rc = new RageCounter();
    game.add.existing(rc);

    messages = game.add.group();
    for (i = 0; i < 20; i++) {
        var message = new Message();
        message.kill();
        messages.add(message);
    }
}

function sendMessage(text) {
    var message = messages.getFirstDead();
    message.go(text);
}

function update() {
    game.physics.arcade.collide(player, platforms); 
    game.physics.arcade.collide(npcs, platforms); 
    game.physics.arcade.collide(stars, platforms);

    game.physics.arcade.overlap(player, stars, overlapPlayerStar);

    var total = 0;
    npcs.forEach(function(npc) {
        total += npc.anger;
        game.physics.arcade.overlap(npc, npcs, npcOverlap);
        game.physics.arcade.overlap(player, npc, playerNPCOverlap);
    });
    
    rc.level = total;

    if (total < 25) {
        greg.text = "GREG IS FURIOUS!";
        // greg is angry!
    } else if (total < 50) {
        greg.text = "GREG IS PULSATING!"; 
        // greg is displeased!
    } else if (total < 80) {
        greg.text = "GREG IS ANGRY!";
        // greg needs a chill pill;
    } else if (total < 100) {
        greg.text = "GREG IS PLEASED!";
        // greg is getting ANGRY!
    } 
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

function playerNPCOverlap(player, npc) {
    if (!spaceKey.isDown) {
        return;
    }
    
    player.beNiceTo(npc);
}

function overlapPlayerStar(player, star) {
    console.log("overlapping");
    star.use();
    player.giveNiceness();
}

Player = function() {
    Phaser.Sprite.call(this, game, 0, 0, 'player');
    game.physics.arcade.enable(this);
    
    this.x = (game.width - this.width) / 2;
    this.nice = 0;
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

Player.prototype.beNiceTo = function(npc) {
    // TODO - different levels of "healing"
    if (this.nice <= 0 || npc.anger < 1) {
        return;
    }

    npc.anger = 0;
    this.nice -= 1;
    sendMessage("Hmm you are nice!");
};

Player.prototype.giveNiceness = function() {
    this.nice += 1; 
    sendMessage("I love a bit of niceness");
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

    this.modifier = Math.random() / 2 + 0.1;
};

NPC.prototype = Object.create(Phaser.Sprite.prototype);
NPC.prototype.contstructor = NPC;

NPC.prototype.update = function() {
    // anger management
    if (this.anger < 9) { 
        this.anger += (game.time.physicsElapsed * this.modifier) * 0.5;
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
        return;
    }

    otherNPC.anger *= 1.5;
    this.lastRaged = otherNPC.lastRaged = this.game.time.now;
    sendMessage("*punch* *slam*");
};

RageCounter = function() {
    Phaser.Text.call(this, game, 0, 0, "RAGE LEVEL: ", {});
    this.level = 0;
    this.fixedToCamera = true;
};

RageCounter.prototype = Object.create(Phaser.Text.prototype);
RageCounter.prototype.contstructor = RageCounter; 

RageCounter.prototype.update = function() {
    this.text = "RAGE LEVEL: " + Math.round(this.level);
};

Star = function() {
    Phaser.Sprite.call(this, game, 0, 0, 'star');
    game.physics.arcade.enable(this);
    this.body.gravity.y = 0;
};

Star.prototype = Object.create(Phaser.Sprite.prototype);
Star.prototype.contstructor = Star;

Star.prototype.use = function() {
    this.exists = false;
    game.time.events.add(Phaser.Timer.SECOND * 5, this.comeback, this);
};

Star.prototype.comeback = function() {
    var modX = Math.random() * 50;
    if (Math.random() > 0.5) {
        modX *= -1;
    }

    this.x += modX;
    this.exists = true;
};

Message = function() {
    Phaser.Text.call(this, game, 0, 0, "RAGE LEVEL: ", {});
    game.physics.arcade.enable(this);
    this.anchor.setTo(0.5, 0.5);
};

Message.prototype = Object.create(Phaser.Text.prototype);
Message.prototype.constructor = Message;

Message.prototype.go = function(text) {
    this.text = text;
    this.y = 0;
    this.x = (game.width - this.width) / 2;
    this.body.velocity.y = 50;
    this.alive = true;
    this.exists = true;
    this.visible = true;
};

Message.prototype.update = function() {
    if (this.y >= game.height) {
        this.kill();
    }
};

