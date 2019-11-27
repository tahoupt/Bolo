// This example uses the Phaser 2.8 framework

// Copyright © 2017 Behavioral Cybernetics


//-----------------------------------------------------------------------------
// Maze Variables

var N = 1 << 0,
S = 1 << 1,
W = 1 << 2,
E = 1 << 3;

var CELLSPERMAZESIDE = 20;

var MAZEINSET = 48;

var cellSize = 240;
var cellWallWidth = 4;
var cellSpacing = cellSize + cellWallWidth;

var gameWidth = CELLSPERMAZESIDE * cellSpacing + 2 * MAZEINSET;
var gameHeight = CELLSPERMAZESIDE * cellSpacing + 2 * MAZEINSET;


var viewWidth = 800, viewHeight = 600;
//var viewWidth = 1920, viewHeight = 1080;


var cellWidth = Math.floor(  (gameWidth - 2 * MAZEINSET)  / cellSpacing);
var cellHeight = Math.floor( (gameHeight - 2 * MAZEINSET)  / cellSpacing);
var cells; // each cell’s edge bits
var walls; // the sprites for each cell wall


// NOTE: need to make distance into a precomputed table...
//distance = d3.range(cellWidth * cellHeight).map(function() { return 0; }),
var frontier = [(cellHeight - 1) * cellWidth];

//-----------------------------------------------------------------------------
// BUG GLOBALS

var bugs = new Array; // the bug sprites

var bugVelocity = { "bee":20, "wasp":50, "dragon": 100};
var bugAcceleration = { "bee":0, "wasp":0 , "dragon": 0};

var NUMWASPS = 2;
var NUMBEES = 2;
var BUGTURNINGANGLE = 15;


//-----------------------------------------------------------------------------
// SHIP GLOBALS

var ship;

var oldcameraX = 0;
var oldcameraY = 0;

// Define motion constants
var ROTATION_SPEED = 180; // degrees/second
var ACCELERATION = 50; // pixels/second/second
var MAX_SPEED = 250; // pixels/second
var DRAG = 50; // pixels/second
var TREADFRAME = 0; // starting tread sprite

var FIRINGRATE = 400; // note that firing rate should be same length as cannon sound
var NUMBULLETS = 10;

var fireButton;
var explosions;
var NUMEXPLOSIONS = 10;
var cannon_sound; // note that firing rate should be same length as cannon sound
var explosion_sound;

// Designed weapon - bio gun hit, heavy pound (3).

//-----------------------------------------------------------------------------

// Load images and sounds
function preload() {

  //  this.game.load.spritesheet('ship', 'assets/gfx/ship.png', 32, 32);
    this.game.load.spritesheet('ship', 'assets/bolo-tank.png', 64, 32);
    this.game.load.spritesheet('east-wall', 'assets/east-wall-gray.png', 4, 128);
    this.game.load.spritesheet('south-wall', 'assets/south-wall-gray.png', 128, 4);
    this.game.load.spritesheet('wasp', 'assets/wasp.png', 24, 38);
    this.game.load.spritesheet('bee', 'assets/bee.png', 29, 40);
    this.game.load.spritesheet('dragon', 'assets/dragon.png', 64 , 80);

   // this.game.load.spritesheet('ant', 'assets/ant.png', 128, 4);
   // this.game.load.spritesheet('spider', 'assets/spider.png', 128, 4);
   // this.game.load.spritesheet('queen', 'assets/queen.png', 128, 4);


   // this.game.load.image('bullet', '/assets/gfx/bullet.png');
   
    //   this.game.load.spritesheet('bullet', 'assets/rgblaser.png', 4, 4);
    this.game.load.spritesheet('bullet', 'assets/bullet.png', 4, 8);

     this.game.load.spritesheet('explosion', 'assets/multi_explosion.png', 48 , 48);



 // this.game.load.audio('montreal', ['assets/sounds/autechre_montreal.mp4']);
  this.game.load.audio('nil', ['assets/sounds/autechre_nil.mp4']);
  this.game.load.audio('cannon', ['assets/sounds/techno_cannon.mp4']);

      this.game.load.audio('boom', ['assets/sounds/ant_explosion.mp4']);
};

function create() {


    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    
    this.game.stage.backgroundColor = 0x666666;


    explosion_sound = game.add.audio('boom');
    cannon_sound = game.add.audio('cannon');
    music =  game.add.audio('nil');

    // music.play("", 0,1,true,true);
   // music.play("", 0,0.25,true,true);

    // Add the ship to the stage
    ship = this.game.add.sprite((this.game.width+MAZEINSET)/2, (this.game.height+MAZEINSET)/2, 'ship');

    ship.anchor.setTo(0.5, 0.5);
    ship.angle = -90; // Point the ship up

    // Enable physics on the ship
    this.game.physics.enable(ship, Phaser.Physics.ARCADE);

    // Set maximum velocity
    ship.body.maxVelocity.setTo(MAX_SPEED, MAX_SPEED); // x, y

    // Add drag to the ship that slows it down when it is not accelerating
    ship.body.drag.setTo(DRAG, DRAG); // x, y

    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);

    // Show FPS
    this.game.time.advancedTiming = true;
    this.fpsText = this.game.add.text(
        20, 20, '', { font: '16px Arial', fill: '#ffffff' }
    );
    
    
    this.game.world.setBounds(0, 0, gameWidth, gameHeight);

    ship.body.collideWorldBounds = true;
        
    setupMazeWalls();
    
    generateBugs();
    
    // make bullets
    
    //  Creates NUMBULLETS bullets, using the 'bullet' graphic
    weapon = game.add.weapon(NUMBULLETS, 'bullet');

    //  The 'rgblaser.png' is a Sprite Sheet with 80 frames in it (each 4x4 px in size)
    //  The 3rd argument tells the Weapon Plugin to advance to the next frame each time
    //  a bullet is fired, when it hits 80 it'll wrap to zero again.
    //  You can also set this via this.weapon.bulletFrameCycle = true
 //   weapon.setBulletFrames(0, 80, true);

    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;

    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 400;

    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every FIRINGRATE ms
    weapon.fireRate = FIRINGRATE;


    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(ship, 20, 0, true);
    
    

    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);


    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(NUMEXPLOSIONS, 'explosion');
    for (var i = 0; i< NUMEXPLOSIONS; i++ ) { 
        explosions.children[i].animations.add('explosion'); 
        explosions.children[i].anchor.x = 0.5;
        explosions.children[i].anchor.y = 0.5;
    }

};



// The update() method is called every frame
function update() {
    
    
    //  Collide the tank with the walls
    game.physics.arcade.collide(ship, walls, shipHitWall);
    
    if (this.game.time.fps !== 0) {
       // this.fpsText.setText(this.game.time.fps + ' FPS');
        
        this.fpsText.setText(frontier + ' FPS');

    }

    // ADJUST TANK SPEED AND HEADING, BASED ON KEYBOARD INPUT

    var speed2 = (ship.body.velocity.x * ship.body.velocity.x) + (ship.body.velocity.y * ship.body.velocity.y);
    var acceler2 = (ship.body.acceleration.x * ship.body.acceleration.x) + (ship.body.acceleration.y * ship.body.acceleration.y);
    
    var speed = Math.sqrt(speed2);
    var acceleration = Math.sqrt(acceler2);

    if (this.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        // If the LEFT key is down, rotate left
        ship.body.angularVelocity = -ROTATION_SPEED;
        ship.body.velocity.x = Math.cos(ship.rotation) * speed;
        ship.body.velocity.y = Math.sin(ship.rotation) * speed;
        ship.body.acceleration.x = Math.cos(ship.rotation) * acceleration;
        ship.body.acceleration.y = Math.sin(ship.rotation) * acceleration;


    } else if (this.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        // If the RIGHT key is down, rotate right
        ship.body.angularVelocity = ROTATION_SPEED;

        ship.body.velocity.x = Math.cos(ship.rotation) * speed;
        ship.body.velocity.y = Math.sin(ship.rotation) * speed;
        ship.body.acceleration.x = Math.cos(ship.rotation) * acceleration;
        ship.body.acceleration.y = Math.sin(ship.rotation) * acceleration;
    } else {
        // Stop rotating
        ship.body.angularVelocity = 0;
    }
    

    if (this.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        // If the UP key is down, thrust
        
        // Calculate acceleration vector based on this.angle and this.ACCELERATION
        ship.body.acceleration.x = Math.cos(ship.rotation) * ACCELERATION;
        ship.body.acceleration.y = Math.sin(ship.rotation) * ACCELERATION;


		TREADFRAME = !TREADFRAME;
        // Show the frame from the spritesheet with the engine on
        ship.frame = TREADFRAME + 1;
        
    }  else if (this.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {

		// brake...
        ship.body.acceleration.setTo(0, 0);
         ship.body.velocity.setTo(0, 0);

        // Show the frame from the spritesheet with the engine off
        ship.frame = 0;

	} else {
        // Otherwise, stop thrusting
        ship.body.acceleration.setTo(0, 0);

        // Show the frame from the spritesheet with the engine off
        ship.frame = 0;
    }
    
    // ADJUST CAMERA TO KEEP TANK IN CENTER OF SCREEN
    var cameraX, cameraY;
    if (ship.world.x < viewWidth/2) {
        cameraX =0;
    }
    else if (ship.world.x > gameWidth - viewWidth/2) {
        cameraX = gameWidth - viewWidth;
    }
    else {
        cameraX = ship.world.x - viewWidth/2;
    }
    
    
    if (ship.world.y < viewHeight/2) {
        cameraY = 0;
    }
    else if (ship.world.y > gameHeight - viewHeight/2) {
        cameraY = gameHeight - viewHeight;
    }
    else {
        cameraY = ship.world.y - viewHeight/2;
    }
    
    game.camera.x = cameraX;
    game.camera.y = cameraY;

    
    
//    if (oldcameraX != cameraX || oldcameraY != cameraY ) {
//        console.log("camera: " + cameraX + ", " + cameraY + " ship: " + ship.world.x + ", " + ship.world.y);
//        oldcameraX = cameraX;oldcameraY = cameraY;
//   }
//    
//    

    // MOVE THE BUGS

    
     for (var i=0;i<bugs.length; i++) {
     
          //  Collide the bugs with the walls
        game.physics.arcade.collide(bugs[i], walls,bugBounce);
        
        
        game.physics.arcade.collide(bugs[i], ship, bugBounce);

        
         for (var j=0;j<bugs.length; j++) {
                if (j != i) {
                    game.physics.arcade.collide(bugs[i], bugs[j],bugBounce);

                }
         }

     
        if (bugs[i].frame == 0)  { bugs[i].wing_beat = 1; }
        if (bugs[i].frame == 4)  { bugs[i].wing_beat = -1; }
        bugs[i].frame += bugs[i].wing_beat;
        
        

    
     }
     
     	// check for bullet collisions 
        
        game.physics.arcade.overlap(bugs,weapon.bullets, bugWasShot);

        game.physics.arcade.overlap(walls,weapon.bullets, wallWasShot);


     
      if (fireButton.isDown) {
        weapon.fire();
        cannon_sound.play("",0,.5,false,false);
    }
    
    
        
        

};

function render () {

    game.debug.cameraInfo(game.camera, 32, 48);
//    weapon.debug();
//    
//    game.debug.soundInfo(music, 32, 128);

}

function bugBounce(bug,anObject) {

            // keep adjusting by 22.5 degrees until no longer colliding
            
            bug.angle = Math.random() > 0.5 ? bug.angle + BUGTURNINGANGLE : bug.angle - BUGTURNINGANGLE ;
            bug.body.velocity.x = Math.cos(bug.rotation) * bugVelocity[bug.bugType];
            bug.body.velocity.y = Math.sin(bug.rotation) * bugVelocity[bug.bugType];

};


function bugWasShot(bug,bullet) {

    

    
        var explosion = explosions.getFirstExists(false);

    explosion.reset( bug.body.x + bug.body.width/2,bug.body.y + bug.body.height/2);
    explosion.play('explosion', 10, false, true);
    explosion_sound.play("",0,.5,false,true);
    
    //  Increase the score
//    score += bug.value;
//    scoreText.text = scoreString + score;


    bug.kill();
    bullet.kill();



}

function wallWasShot(wall,bullet) {



    var explosion = explosions.getFirstExists(false);

    explosion.reset( bullet.body.x ,bullet.body.y);
    explosion.play('explosion', 10, false, true);
    explosion_sound.play("",0,.5,false,true);

    bullet.kill();


}

function shipHitWall(ship,wall) {
    var explosion = explosions.getFirstExists(false);

    // place explosion at center of ship, then move it to tip of barrel
    var xOffset = Math.cos(ship.rotation) * 32;
    var yOffset =  Math.sin(ship.rotation) * 16;
    explosion.reset( ship.body.x + 32 + xOffset,ship.body.y + 16 + yOffset);
    explosion.play('explosion', 10, false, true);
    explosion_sound.play("",0,.5,false,true);
    ship.kill();


}


//-----------------------------------------------------------------------------

function initializeBug(bug) {
        bug.anchor.setTo(0.5, 0.5);
        bug.angle = Math.random() * 360;
        
        bug.angle = 0;

        this.game.physics.enable(bug, Phaser.Physics.ARCADE);
        bug.enableBody = true;
        bug.body.collideWorldBounds = true;

        bug.frame = Math.floor(Math.random() * 5);
        bug.wing_beat = Math.random() > 0.5 ? 1 : -1;

        
        bug.body.velocity.x = Math.cos(bug.rotation) * bugVelocity[bug.bugType];
        bug.body.velocity.y = Math.sin(bug.rotation) * bugVelocity[bug.bugType];
        bug.body.acceleration.x = Math.cos(bug.rotation) * bugAcceleration[bug.bugType];
        bug.body.acceleration.y = Math.sin(bug.rotation) * bugAcceleration[bug.bugType];
       // bug.body.bounce.set(1);

        bug.animations.add('explosion');


};

function generateBugs() {

  // set up some bug sprites

    for (var i=0;i<NUMWASPS;i++) {
        var x = (Math.random() * this.game.width);
        var y = (Math.random() * this.game.height);
        
       var aWasp = this.game.add.sprite(x,y, 'wasp');
    
       aWasp.bugType = 'wasp';
       initializeBug(aWasp);

       bugs.push(aWasp);

   }
   for (var i=0;i<NUMBEES;i++) {
        var x = (Math.random() * this.game.width);
        var y = (Math.random() * this.game.height);
        
       var aBee = this.game.add.sprite(x,y, 'bee');
       aBee.bugType = 'bee';

       initializeBug(aBee);

       bugs.push(aBee);

    }

        var x = (Math.random() * this.game.width);
        var y = (Math.random() * this.game.height);
        
       var dragon = this.game.add.sprite(x,y, 'dragon');
       dragon.bugType = 'dragon';

       initializeBug(dragon);

       bugs.push(dragon);



};


//-----------------------------------------------------------------------------

// based on one of Mike Bostock's random maze generators
// Randomized Depth-First II
// https://bl.ocks.org/mbostock/97f1cdb9e0a695cd8df4

// or maybe random-depth first III?
// https://bl.ocks.org/mbostock/949c772b81296f8e4188

function fillCell(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;
    
   // cellShape.drawRect(x * cellSize + (x + 1) * cellWallWidth, y * cellSize + (y + 1) * cellWallWidth, cellSize, cellSize);
}

function fillEast(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;
    walls.create((x + 1) * (cellSize + cellWallWidth), y * cellSize + (y + 1) * cellWallWidth, 'east-wall'); // .body.immovable = true;
}

function fillSouth(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;
    walls.create(x * cellSize + (x + 1) * cellWallWidth, (y + 1) * (cellSize + cellWallWidth), 'south-wall'); //.body.immovable = true;
}

function generateMaze(width, height) {
    var cells = new Array(cellWidth * cellHeight), // each cell’s edge bits
    frontier = [];
    
    var start = (cellHeight - 1) * cellWidth;
    cells[start] = 0;
    frontier.push({index: start, direction: N});
    frontier.push({index: start, direction: E});
    shuffle(frontier, 0, 2);
    while (!exploreFrontier());
    return cells;
    
    function exploreFrontier() {
        if ((edge = frontier.pop()) == null) return true;
        
        var edge,
        i0 = edge.index,
        d0 = edge.direction,
        i1 = i0 + (d0 === N ? -cellWidth : d0 === S ? cellWidth : d0 === W ? -1 : +1),
        x0 = i0 % cellWidth,
        y0 = i0 / cellWidth | 0,
        x1,
        y1,
        d1,
        open = cells[i1] == null; // opposite not yet part of the maze
        
        if (d0 === N) x1 = x0, y1 = y0 - 1, d1 = S;
        else if (d0 === S) x1 = x0, y1 = y0 + 1, d1 = N;
        else if (d0 === W) x1 = x0 - 1, y1 = y0, d1 = E;
        else x1 = x0 + 1, y1 = y0, d1 = W;
        
        if (open) {
            cells[i0] |= d0, cells[i1] |= d1;
            
            var m = 0;
            if (y1 > 0 && cells[i1 - cellWidth] == null) frontier.push({index: i1, direction: N}), ++m;
            if (y1 < cellHeight - 1 && cells[i1 + cellWidth] == null) frontier.push({index: i1, direction: S}), ++m;
            if (x1 > 0 && cells[i1 - 1] == null) frontier.push({index: i1, direction: W}), ++m;
            if (x1 < cellWidth - 1 && cells[i1 + 1] == null) frontier.push({index: i1, direction: E}), ++m;
            shuffle(frontier, frontier.length - m, frontier.length);
        }
    }
}

function popRandom(array) {
    if (!array.length) return;
    var n = array.length, i = Math.random() * n | 0, t;
    t = array[i], array[i] = array[n - 1], array[n - 1] = t;
    return array.pop();
}

function shuffle(array, i0, i1) {
    var m = i1 - i0, t, i, j;
    while (m) {
        i = Math.random() * m-- | 0;
        t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
}


function setupMazeWalls() {
    // set up the maze walls
    
   cells = generateMaze(cellWidth, cellHeight); // each cell’s edge bits

    var cellShape = game.add.graphics(0, 0);  //init rect
    cellShape.lineStyle(4, 0x0000FF, 1); // gameWidth, color (0x0000FF), alpha (0 -> 1) // required settings
    cellShape.beginFill(0xFFFFFF, 1); // color (0xFFFF0B), alpha (0 -> 1) // required settings

    walls = this.game.add.group();
    walls.enableBody = true;
    
    
    for (var y = 0, i = 0; y < cellHeight; ++y) {
        for (var x = 0; x < cellWidth; ++x, ++i) {
           // fillCell(i);
           if (cells[i] & S) {
            // fillSouth(i);
               walls.create(x * cellSpacing + MAZEINSET, (y + 1) * cellSpacing + MAZEINSET, 'south-wall').body.immovable = true;
           }
            if (cells[i] & E) {
                //fillEast(i);
                walls.create((x + 1) * cellSpacing + MAZEINSET, y * cellSpacing + MAZEINSET, 'east-wall').body.immovable = true;
            }
        }
    }
    
    // fill in walls on border of maze
    for (var y = 0; y < cellHeight; ++y) {
         walls.create(0 + MAZEINSET, y * cellSpacing + MAZEINSET, 'east-wall').body.immovable = true;
        walls.create(cellWidth * cellSpacing + MAZEINSET, y * cellSpacing + MAZEINSET, 'east-wall').body.immovable = true;       
    }
    
    
    for (var x = 0; x < cellWidth; ++x, ++i) {
       walls.create(x * cellSpacing + MAZEINSET, 0  + MAZEINSET, 'south-wall').body.immovable = true;
        walls.create(x * cellSpacing + MAZEINSET, cellHeight  * cellSpacing + MAZEINSET, 'south-wall').body.immovable = true;        
    }
        
        
};

//-----------------------------------------------------------------------------


//var game = new Phaser.Game(960, 960, Phaser.AUTO, 'game');

var phaserState = { 'preload': preload, 'create': create, 'update': update, 'render': render };
var game = new Phaser.Game(viewWidth, viewHeight, Phaser.CANVAS, 'game');
game.state.add('game', phaserState, true);


