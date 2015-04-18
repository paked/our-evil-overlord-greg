var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', {preload: preload, create: create, update: update});

var map;
var platforms;
var ladders;

function preload() {
    // preload content
    game.load.image('tilesheet', 'assets/tileset.png');
    game.load.tilemap('map', 'assets/maps/level.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    // create entities
    game.stage.backgroundColor = '#fff';
    game.camera.scale.x = 2;
    game.camera.scale.y = 2;

    var text = game.add.text(16, 16, 'GREG IS HAPPY', {fontSize:'32px', fill: '#000'});
    text.anchor.set(0.5);
    text.x = game.width / 2;
    text.y = game.height / 4;

    map = game.add.tilemap('map');
    map.addTilesetImage('tileset', 'tilesheet');
    platforms = map.createLayer('Platforms');
    ladders = map.createLayer('Ladders');
}

function update() {
    // update sprites
}
