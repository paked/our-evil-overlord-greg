var game = new Phaser.Game(800, 600, Phaser.CANVAS, '', {preload: preload, create: create, update: update});

function preload() {
    // preload content
}

function create() {
    // create entities
    game.stage.backgroundColor = '#fff';

    var text = game.add.text(16, 16, 'GREG IS HAPPY', {fontSize:'32px', fill: '#000'});
    text.anchor.set(0.5);
    text.x = game.width / 2;
    text.y = game.height / 4;
}


function update() {
    // update sprites
}
