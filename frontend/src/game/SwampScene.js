import Phaser from "phaser";
import { WordGame } from "./wordGame";

const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";
const TITLE_FONT = "'Cedarville Cursive', cursive";

// ── Player combat tuning ─────────────────────────────────────
const PLAYER_MAX_HP = 5;
const PLAYER_INVULN_SECONDS = 1.5;
const PLAYER_KNOCKBACK_VX = 230;
const PLAYER_KNOCKBACK_TIME = 0.18;   // seconds the player can't steer after a hit

// ── Goblin tuning ────────────────────────────────────────────
const GOBLIN_SCALE = 0.13;
const GOBLIN_FRAME = 480;
// Physics body in UNSCALED frame pixels (Arcade scales it by the sprite scale)
const GOBLIN_BODY_W = 100;
const GOBLIN_BODY_H = 260;
// Transparent pixels between the goblin's feet and the bottom of the 480px frame.
// If goblin feet look like they float -> increase; if they sink into the ground -> decrease.
const GOBLIN_FEET_PAD = 40;
const GOBLIN_BODY_OFF_X = (GOBLIN_FRAME - GOBLIN_BODY_W) / 2;
const GOBLIN_BODY_OFF_Y = GOBLIN_FRAME - GOBLIN_BODY_H - GOBLIN_FEET_PAD;
const GOBLIN_ATTACK_RANGE = 25;    // px (world) horizontal trigger distance
const GOBLIN_ATTACK_COOLDOWN = 2.5;   // seconds between swings
const GOBLIN_HIT_FRAME_MIN = 6;     // 1-based frame indices of the 10-frame attack
const GOBLIN_HIT_FRAME_MAX = 7;     //   during which the swing can actually connect
const GOBLIN_HIT_REACH = 24;    // px in front of goblin that the swing covers

export default class SwampScene extends Phaser.Scene {
  constructor() {
    super("SwampScene");
    this.coinsCollected = 0;
    this.totalCoins = 0;
    this.runesCollected = 0;
    this.totalRunes = 0;
    this.keysCollected = 0;
    this.totalKeys = 0;

    // Player state flags (no manual physics — arcade handles gravity/velocity)
    this._isAttacking = false;
    this._attackTimer = 0;
    this._attackId = 0;     // increments per swing so one swing hits a goblin once
    this._isCrouching = false;
    this._isDead = false;
    this._spawnX = 120;
    this._spawnY = 200;   // slightly above ground so physics drops player in
    this._mapHeightPx = 0;

    // Player health / damage state
    this._playerHP = PLAYER_MAX_HP;
    this._isInvulnerable = false;
    this._invulnerabilityTimer = 0;
    this._knockbackTimer = 0;
    this._flashTween = null;

    // Water
    this._waterLayer = null;

    // Goblins
    this.goblins = [];    // array of goblin sprites
    this._goblinKills = 0;
  }

  preload() {
    // 1. Tileset and Tilemap
    this.load.image("swamp-tileset", "/game-assests/swamp/1 Tiles/Tileset.png");
    this.load.tilemapTiledJSON("swamp-level1", "/game-assests/swamp/swamp-level1.json");
    // Player spritesheets
    this.load.spritesheet("player-boy-idle", "/game-assests/character/boy/Idle.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("player-boy-walk", "/game-assests/character/boy/Walk.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("player-boy-run", "/game-assests/character/boy/Run.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("player-boy-jump", "/game-assests/character/boy/Jump.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("player-boy-attack", "/game-assests/character/boy/Attack_1.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("player-boy-crouch", "/game-assests/character/boy/Shield.png", { frameWidth: 128, frameHeight: 128 });
    // Kept as alias for legacy reference
    this.load.spritesheet("player-boy", "/game-assests/character/boy/Idle.png", { frameWidth: 128, frameHeight: 128 });

    // Goblin spritesheets (480x480 per frame)
    const GOBLIN = "/game-assests/swamp/Male Goblin/PNG/Spritesheets";
    this.load.spritesheet("goblin-idle", `${GOBLIN}/Left - Idle.png`, { frameWidth: 480, frameHeight: 480 });
    this.load.spritesheet("goblin-walk", `${GOBLIN}/Left - Walking.png`, { frameWidth: 480, frameHeight: 480 });
    this.load.spritesheet("goblin-hurt", `${GOBLIN}/Left - Hurt.png`, { frameWidth: 480, frameHeight: 480 });
    this.load.spritesheet("goblin-attack", `${GOBLIN}/Left - Attacking.png`, { frameWidth: 480, frameHeight: 480 });
    this.load.spritesheet("goblin-dying", `${GOBLIN}/Dying.png`, { frameWidth: 480, frameHeight: 480 });
    // 2. Parallax Background Layers
    this.load.image("bg-full", "/game-assests/swamp/2 Background/Background.png");
    this.load.image("bg-layer1", "/game-assests/swamp/2 Background/Layers/1.png");
    this.load.image("bg-layer2", "/game-assests/swamp/2 Background/Layers/2.png");
    this.load.image("bg-layer3", "/game-assests/swamp/2 Background/Layers/3.png");
    this.load.image("bg-layer4", "/game-assests/swamp/2 Background/Layers/4.png");
    this.load.image("bg-layer5", "/game-assests/swamp/2 Background/Layers/5.png");

    // 3. Animated Objects Spritesheets
    this.load.spritesheet("anim-chest", "/game-assests/swamp/4 Animated objects/Chest.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("anim-coin", "/game-assests/swamp/4 Animated objects/Coin.png", {
      frameWidth: 10,
      frameHeight: 10,
    });
    this.load.spritesheet("anim-flag", "/game-assests/swamp/4 Animated objects/Flag.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet("anim-key", "/game-assests/swamp/4 Animated objects/Key.png", {
      frameWidth: 8,
      frameHeight: 8,
    });
    this.load.spritesheet("anim-rune", "/game-assests/swamp/4 Animated objects/Rune.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // 4. Props & Objects
    // Boxes
    this.load.image("box-1", "/game-assests/swamp/3 Objects/Boxes/1.png");
    this.load.image("box-2", "/game-assests/swamp/3 Objects/Boxes/2.png");
    this.load.image("box-3", "/game-assests/swamp/3 Objects/Boxes/3.png");
    this.load.image("box-5", "/game-assests/swamp/3 Objects/Boxes/5.png");

    // Trees & Willows
    this.load.image("tree-stump", "/game-assests/swamp/3 Objects/Trees/1.png");
    this.load.image("tree-trunk", "/game-assests/swamp/3 Objects/Trees/2.png");
    this.load.image("tree-gnarled", "/game-assests/swamp/3 Objects/Trees/3.png");
    this.load.image("willow-small", "/game-assests/swamp/3 Objects/Willows/1.png");
    this.load.image("willow-med", "/game-assests/swamp/3 Objects/Willows/2.png");
    this.load.image("willow-huge", "/game-assests/swamp/3 Objects/Willows/3.png");

    // Ladders
    this.load.image("ladder-1", "/game-assests/swamp/3 Objects/Ladders/1.png");
    this.load.image("ladder-2", "/game-assests/swamp/3 Objects/Ladders/2.png");
    this.load.image("ladder-3", "/game-assests/swamp/3 Objects/Ladders/3.png");
    this.load.image("ladder-4", "/game-assests/swamp/3 Objects/Ladders/4.png");

    // Pointers & Signs
    this.load.image("pointer-1", "/game-assests/swamp/3 Objects/Pointers/1.png");
    this.load.image("pointer-2", "/game-assests/swamp/3 Objects/Pointers/2.png");
    this.load.image("pointer-3", "/game-assests/swamp/3 Objects/Pointers/3.png");
    this.load.image("pointer-5", "/game-assests/swamp/3 Objects/Pointers/5.png");

    // Ridges, Stones, Fence, Bushes, Grass
    this.load.image("ridge-1", "/game-assests/swamp/3 Objects/Ridges/1.png");
    this.load.image("ridge-3", "/game-assests/swamp/3 Objects/Ridges/3.png");
    this.load.image("stone-1", "/game-assests/swamp/3 Objects/Stones/1.png");
    this.load.image("stone-2", "/game-assests/swamp/3 Objects/Stones/2.png");
    this.load.image("fence-1", "/game-assests/swamp/3 Objects/Fence/1.png");
    this.load.image("fence-2", "/game-assests/swamp/3 Objects/Fence/2.png");
    this.load.image("bush-1", "/game-assests/swamp/3 Objects/Bushes/1.png");
    this.load.image("bush-4", "/game-assests/swamp/3 Objects/Bushes/4.png");
    this.load.image("bush-5", "/game-assests/swamp/3 Objects/Bushes/5.png");
    this.load.image("grass-1", "/game-assests/swamp/3 Objects/Grass/1.png");
    this.load.image("grass-2", "/game-assests/swamp/3 Objects/Grass/2.png");
    this.load.image("grass-3", "/game-assests/swamp/3 Objects/Grass/3.png");
    this.load.image("grass-4", "/game-assests/swamp/3 Objects/Grass/4.png");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Reset counters
    this.coinsCollected = 0;
    this.totalCoins = 0;
    this.runesCollected = 0;
    this.totalRunes = 0;
    this.keysCollected = 0;
    this.totalKeys = 0;

    // Player state reset
    this._isAttacking = false;
    this._attackTimer = 0;
    this._attackId = 0;
    this._isCrouching = false;
    this._isDead = false;
    this._playerHP = PLAYER_MAX_HP;
    this._isInvulnerable = false;
    this._invulnerabilityTimer = 0;
    this._knockbackTimer = 0;
    this._flashTween = null;
    this._waterLayer = null;
    this.goblins = [];
    this._goblinKills = 0;

    // 1. Create Animations
    this._createAnimations();

    // 2. Setup Tilemap & World Bounds
    const map = this.make.tilemap({ key: "swamp-level1" });
    const tileset = map.addTilesetImage("swamp-tileset", "swamp-tileset");

    const mapWidthPx = map.widthInPixels;
    const mapHeightPx = map.heightInPixels;

    // Set world and camera bounds
    if (this.physics?.world) {
      this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
      // Left / right / top are walls, but the bottom is OPEN so falling into a
      // gap can actually reach the death zone (otherwise the player is clamped
      // at the bottom edge and never "falls").
      this.physics.world.setBoundsCollision(true, true, true, false);
    }
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);

    // 3. Parallax Backgrounds
    this._createParallaxBackgrounds(mapWidthPx, mapHeightPx);

    // 4. Tilemap Layers
    const decorLayer = map.createLayer("Decorations", tileset, 0, 0);
    const groundLayer = map.createLayer("Ground", tileset, 0, 0);
    const waterLayer = map.createLayer("Water", tileset, 0, 0);

    // Enable collision on every painted tile in Ground layer
    groundLayer.setCollisionByExclusion([-1]);

    groundLayer.setDepth(10);
    waterLayer.setDepth(11);
    if (decorLayer) decorLayer.setDepth(12);

    // Water is NOT a solid / physics layer. It is only queried by tile lookup
    // in _checkWater() so it can never act as ground or kill on a stray overlap.
    this._waterLayer = waterLayer;

    // Store map height for death zone
    this._mapHeightPx = mapHeightPx;

    // Player spawn (read from Tiled object layer, fall back to hardcoded)
    let spawnX = this._spawnX;
    let spawnY = this._spawnY;
    const spawnLayer = map.getObjectLayer("Player");
    if (spawnLayer) {
      const spawn = spawnLayer.objects.find(obj => obj.name === "PlayerSpawn");
      if (spawn) { spawnX = spawn.x; spawnY = spawn.y; }
    }
    this._spawnX = spawnX;
    this._spawnY = spawnY;

    // Create player as an Arcade Physics sprite
    this.player = this.physics.add.sprite(spawnX, spawnY, "player-boy-idle", 0)
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setDepth(20);

    // Shrink the physics body to match the visible character (128px sprite, scaled 0.8)
    // Body is 30 wide x 60 tall, offset to sit inside the feet area of the art
    this.player.body.setSize(30, 60);
    this.player.body.setOffset(49, 68);  // center horizontally, align to feet
    this.player.body.setGravityY(1000);  // extra downward force on top of world gravity
    this.player.body.setMaxVelocityY(800);
    this.player.body.setCollideWorldBounds(true);

    this.player.play("boy-idle");

    // Tilemap collision — Ground layer only
    this.physics.add.collider(this.player, groundLayer);

    // Store groundLayer so WordGame can access it for spawning goblins
    this._groundLayer = groundLayer;

    // 5. Place Props & Nature Objects
    this._placeProps();

    // 6. Place Collectibles & Interactive Animated Objects
    this._placeAnimatedObjects();

    // 7. Spawn Goblins (needs groundLayer for collider)
    this._spawnGoblins(groundLayer);

    // 8. Ambient Atmosphere & Particles (Fireflies, Mist)
    this._createAtmosphere(mapWidthPx, mapHeightPx);

    // 9. Camera Setup & Navigation Controls
    this._setupCamera(mapWidthPx, mapHeightPx);

    // 10. Player Input
    this._setupPlayerInput();

    // 11. Modern HUD & UI Overlay
    this._createHUD();

    // 12. Start the Word Game — spawns letter-goblins for each round
    this.wordGame = new WordGame(this);
    this.wordGame.start(1);
  }

  _createAnimations() {
    if (!this.anims.exists("coin-spin")) {
      this.anims.create({
        key: "coin-spin",
        frames: this.anims.generateFrameNumbers("anim-coin", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists("rune-pulse")) {
      this.anims.create({
        key: "rune-pulse",
        frames: this.anims.generateFrameNumbers("anim-rune", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists("flag-flutter")) {
      this.anims.create({
        key: "flag-flutter",
        frames: this.anims.generateFrameNumbers("anim-flag", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists("key-spin")) {
      this.anims.create({
        key: "key-spin",
        frames: this.anims.generateFrameNumbers("anim-key", { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists("chest-open")) {
      this.anims.create({
        key: "chest-open",
        frames: this.anims.generateFrameNumbers("anim-chest", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: 0,
      });
    }

    // ── Player animations ──────────────────────────────────────
    const boyAnims = [
      { key: "boy-idle", texture: "player-boy-idle", start: 0, end: 5, rate: 8, repeat: -1 },
      { key: "boy-walk", texture: "player-boy-walk", start: 0, end: 7, rate: 10, repeat: -1 },
      { key: "boy-run", texture: "player-boy-run", start: 0, end: 7, rate: 14, repeat: -1 },
      { key: "boy-jump", texture: "player-boy-jump", start: 0, end: 5, rate: 10, repeat: 0 },
      { key: "boy-attack", texture: "player-boy-attack", start: 0, end: 3, rate: 12, repeat: 0 },
      { key: "boy-crouch", texture: "player-boy-crouch", start: 0, end: 0, rate: 4, repeat: -1 },
    ];

    boyAnims.forEach(({ key, texture, start, end, rate, repeat }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(texture, { start, end }),
          frameRate: rate,
          repeat,
        });
      }
    });

    // ── Goblin animations ─────────────────────────────────────
    // goblin-idle: 4x4 = 16 frames
    // goblin-walk: 4x5 = 20 frames
    // goblin-attack/hurt/dying: 5x2 = 10 frames
    const goblinAnims = [
      { key: "goblin-idle", texture: "goblin-idle", start: 0, end: 15, rate: 8, repeat: -1 },
      { key: "goblin-walk", texture: "goblin-walk", start: 0, end: 19, rate: 10, repeat: -1 },
      { key: "goblin-attack", texture: "goblin-attack", start: 0, end: 9, rate: 12, repeat: 0 },
      { key: "goblin-hurt", texture: "goblin-hurt", start: 0, end: 9, rate: 12, repeat: 0 },
      { key: "goblin-dying", texture: "goblin-dying", start: 0, end: 9, rate: 8, repeat: 0 },
    ];

    goblinAnims.forEach(({ key, texture, start, end, rate, repeat }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(texture, { start, end }),
          frameRate: rate,
          repeat,
        });
      }
    });
  }

  _createParallaxBackgrounds(mapWidth, mapHeight) {
    // Solid base background to ensure scene is never blank
    this.add.image(0, 0, "bg-full")
      .setOrigin(0, 0)
      .setDisplaySize(mapWidth + 1280, mapHeight)
      .setScrollFactor(0.2, 1)
      .setDepth(0);

    const scale = mapHeight / 324;
    const layers = [
      { key: "bg-layer1", scroll: 0.1, depth: 1 },
      { key: "bg-layer2", scroll: 0.25, depth: 2 },
      { key: "bg-layer3", scroll: 0.45, depth: 3 },
      { key: "bg-layer4", scroll: 0.65, depth: 4 },
      { key: "bg-layer5", scroll: 0.85, depth: 5 },
    ];

    this.parallaxLayers = layers.map((l) => {
      const ts = this.add.tileSprite(0, 0, mapWidth + 1280, mapHeight, l.key)
        .setOrigin(0, 0)
        .setTileScale(scale, scale)
        .setScrollFactor(l.scroll, 1)
        .setDepth(l.depth);
      return { sprite: ts, scroll: l.scroll };
    });
  }

  _placeProps() {
    // Left platform (Y = 7 * 32 = 224)
    // Wooden crate
    const crate1 = this.add.image(64, 224, "box-1").setOrigin(0.5, 1).setDepth(15);
    this._makeInteractiveBounce(crate1, "Crate inspected!");

    // Grass & Bush on left platform
    this.add.image(20, 224, "grass-1").setOrigin(0.5, 1).setDepth(14);
    this.add.image(192, 224, "bush-1").setOrigin(0.5, 1).setDepth(14);

    // Hanging Ladder segments from left platform (X = 176, Y = 288..448)
    for (let y = 288; y <= 448; y += 32) {
      const key = y === 288 ? "ladder-1" : y === 448 ? "ladder-4" : "ladder-2";
      this.add.image(176, y, key).setOrigin(0.5, 1).setDepth(13);
    }

    // Lower left floor (Y = 480)
    // Dead swamp stump
    this.add.image(105, 480, "tree-stump").setOrigin(0.5, 1).setDepth(14);
    // Wooden sign pointing right
    this.add.image(42, 480, "pointer-1").setOrigin(0.5, 1).setDepth(15);
    // Reeds & Grass
    this.add.image(150, 480, "grass-3").setOrigin(0.5, 1).setDepth(14);
    this.add.image(230, 480, "grass-4").setOrigin(0.5, 1).setDepth(14);

    // Floating Platform A (X = 368, Y = 192)
    this.add.image(368, 192, "pointer-2").setOrigin(0.5, 1).setDepth(15);

    // Floating Platform B (X = 608, Y = 256)
    this.add.image(620, 256, "ridge-1").setOrigin(0.5, 1).setDepth(14);
    this.add.image(565, 256, "grass-2").setOrigin(0.5, 1).setDepth(14);

    // Center Ground (Y = 480)
    // Massive gnarled swamp tree
    const deadTree = this.add.image(460, 480, "tree-gnarled").setOrigin(0.5, 1).setDepth(9);
    deadTree.setScale(1.1);

    // Question Crate
    const qCrate = this.add.image(495, 480, "box-3").setOrigin(0.5, 1).setDepth(15);
    this._makeInteractiveMysteryBox(qCrate);

    // Wooden warning sign
    this.add.image(620, 480, "pointer-5").setOrigin(0.5, 1).setDepth(15);
    this.add.image(405, 480, "stone-2").setOrigin(0.5, 1).setDepth(14);

    // Right Cliff & Plateau (Y = 288)
    // Giant Weeping Willow with hanging vines draped down the cliff
    const willow = this.add.image(865, 288, "willow-huge").setOrigin(0.5, 1).setDepth(8);
    willow.setScale(1.15);

    // Ancient stone boulders & totems on cliff
    this.add.image(1050, 288, "stone-1").setOrigin(0.5, 1).setDepth(14);
    this.add.image(1160, 288, "stone-2").setOrigin(0.5, 1).setDepth(14);

    // Wooden fence on plateau
    this.add.image(920, 288, "fence-1").setOrigin(0.5, 1).setDepth(14);
    this.add.image(945, 288, "fence-2").setOrigin(0.5, 1).setDepth(14);
    this.add.image(1120, 288, "fence-1").setOrigin(0.5, 1).setDepth(14);

    // Wooden treasure crate on far plateau
    const crate2 = this.add.image(1210, 288, "box-2").setOrigin(0.5, 1).setDepth(15);
    this._makeInteractiveBounce(crate2, "Ancient Supply Crate");

    // Bushes & swamp vegetation
    this.add.image(740, 480, "bush-5").setOrigin(0.5, 1).setDepth(14);
    this.add.image(1005, 288, "bush-4").setOrigin(0.5, 1).setDepth(14);
  }

  _placeAnimatedObjects() {
    // 1. Treasure Chest on Left Platform
    const chest = this.add.sprite(135, 224, "anim-chest", 0)
      .setOrigin(0.5, 1)
      .setDepth(16)
      .setScale(1.1)
      .setInteractive({ useHandCursor: true });

    chest.opened = false;
    chest.on("pointerdown", () => {
      if (!chest.opened) {
        chest.opened = true;
        chest.play("chest-open");
        this._spawnSparkles(chest.x, chest.y - 16, 0xffd700);
        this._showFloatingText(chest.x, chest.y - 40, "+300 Swamp Gold! 👑", "#ffd700");
        this._collectCoin(3);
      }
    });

    // 2. Golden Keys
    this._createKey(64, 170); // Floating above left crate
    this._createKey(1245, 140); // Atop lookout platform

    // 3. Ancient Mystical Runes
    this._createRune(575, 430); // Center tree glade
    this._createRune(835, 215); // Among weeping willow vines

    // 4. Fluttering Banner Flag
    const flag = this.add.sprite(975, 288, "anim-flag")
      .setOrigin(0.5, 1)
      .setDepth(16)
      .setScale(1.1);
    flag.play("flag-flutter");

    // 5. Floating Gold Coins along the path
    const coinPositions = [
      // Floating Platform A
      { x: 368, y: 145 },
      // Arc between Platform A and B
      { x: 440, y: 125 },
      { x: 505, y: 135 },
      { x: 565, y: 170 },
      // Platform B
      { x: 610, y: 220 },
      // Center ground
      { x: 380, y: 440 },
      { x: 680, y: 440 },
      // Near Willow & Cliff
      { x: 890, y: 250 },
      { x: 1085, y: 250 },
      { x: 1160, y: 250 },
    ];

    coinPositions.forEach((pos) => this._createCoin(pos.x, pos.y));
  }

  _createCoin(x, y) {
    this.totalCoins++;
    const coin = this.add.sprite(x, y, "anim-coin")
      .setOrigin(0.5)
      .setDepth(16)
      .setScale(1.8)
      .setInteractive({ useHandCursor: true });

    coin.play("coin-spin");

    // Gentle floating bob animation
    this.tweens.add({
      targets: coin,
      y: y - 6,
      duration: 1000 + Math.random() * 400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    coin.on("pointerdown", () => {
      this._collectCoin(1);
      this._spawnSparkles(coin.x, coin.y, 0xffe066);
      this._showFloatingText(coin.x, coin.y - 12, "+10", "#ffd700");
      coin.destroy();
    });
  }

  _createKey(x, y) {
    this.totalKeys++;
    const key = this.add.sprite(x, y, "anim-key")
      .setOrigin(0.5)
      .setDepth(17)
      .setScale(2)
      .setInteractive({ useHandCursor: true });

    key.play("key-spin");

    this.tweens.add({
      targets: key,
      y: y - 8,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    key.on("pointerdown", () => {
      this.keysCollected++;
      this._updateHUD();
      this._spawnSparkles(key.x, key.y, 0x66ffcc);
      this._showFloatingText(key.x, key.y - 15, "Swamp Key Obtained! 🗝️", "#66ffcc");
      key.destroy();
    });
  }

  _createRune(x, y) {
    this.totalRunes++;
    const rune = this.add.sprite(x, y, "anim-rune")
      .setOrigin(0.5)
      .setDepth(17)
      .setScale(1.6)
      .setInteractive({ useHandCursor: true });

    rune.play("rune-pulse");

    // Pulsing mystical glow effect
    this.tweens.add({
      targets: rune,
      scaleX: 1.85,
      scaleY: 1.85,
      alpha: 0.85,
      duration: 1400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    rune.on("pointerdown", () => {
      this.runesCollected++;
      this._updateHUD();
      this._spawnSparkles(rune.x, rune.y, 0x80ff80);
      this._showFloatingText(rune.x, rune.y - 18, "Ancient Rune Activated! 🌿", "#a3f78c");
      rune.destroy();
    });
  }

  _makeInteractiveMysteryBox(sprite) {
    sprite.setInteractive({ useHandCursor: true });
    sprite.hitCount = 0;

    sprite.on("pointerdown", () => {
      sprite.hitCount++;
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 12,
        duration: 100,
        yoyo: true,
        ease: "Quad.easeOut",
      });

      if (sprite.hitCount <= 3) {
        this._collectCoin(1);
        this._spawnSparkles(sprite.x, sprite.y - 20, 0xffcc00);
        this._showFloatingText(sprite.x, sprite.y - 30, "+10 Gold!", "#ffd700");
      } else if (sprite.hitCount === 4) {
        this._showFloatingText(sprite.x, sprite.y - 30, "Empty!", "#aaa");
      }
    });
  }

  _makeInteractiveBounce(sprite, text) {
    sprite.setInteractive({ useHandCursor: true });
    sprite.on("pointerdown", () => {
      this.tweens.add({
        targets: sprite,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
      });
      this._showFloatingText(sprite.x, sprite.y - 20, text, "#d0f0c0");
    });
  }

  _collectCoin(count) {
    this.coinsCollected += count;
    this._updateHUD();
  }

  _spawnSparkles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.circle(x, y, Phaser.Math.Between(2, 4), color)
        .setDepth(25);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(30, 70);

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 600,
        ease: "Quad.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  _showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: "15px",
      fontWeight: "bold",
      color: color,
      stroke: "#0e1a08",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 1100,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  _createAtmosphere(mapWidth, mapHeight) {
    // Ambient floating fireflies / swamp spores
    for (let i = 0; i < 28; i++) {
      const x = Phaser.Math.Between(30, mapWidth - 30);
      const y = Phaser.Math.Between(100, mapHeight - 50);
      const fly = this.add.circle(x, y, Phaser.Math.Between(2, 3), 0xb3f56a, 0.75)
        .setDepth(20);

      this.tweens.add({
        targets: fly,
        y: y + Phaser.Math.Between(-30, 30),
        x: x + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.2, to: 0.9 },
        scale: { from: 0.6, to: 1.3 },
        duration: Phaser.Math.Between(2200, 4500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  _setupCamera(mapWidth, mapHeight) {
    const cam = this.cameras.main;
    cam.setZoom(1.0);

    // Smooth follow the player
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setFollowOffset(0, 80); // keep player slightly below center

    // Enable smooth mouse/touch dragging (overrides follow temporarily)
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;

    this.input.on("pointerdown", (pointer) => {
      if (pointer.y < 80) return;
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      camStartX = cam.scrollX;
      camStartY = cam.scrollY;
      cam.stopFollow();
    });

    this.input.on("pointermove", (pointer) => {
      if (!isDragging) return;
      const dx = (pointer.x - dragStartX) / cam.zoom;
      const dy = (pointer.y - dragStartY) / cam.zoom;
      cam.scrollX = camStartX - dx;
      cam.scrollY = camStartY - dy;
    });

    this.input.on("pointerup", () => {
      if (isDragging) {
        isDragging = false;
        // Resume following player after a short delay
        this.time.delayedCall(1200, () => {
          cam.startFollow(this.player, true, 0.1, 0.1);
          cam.setFollowOffset(0, 80);
        });
      }
    });
  }

  _setupPlayerInput() {
    if (!this.input?.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this._keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this._keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // ─────────────────────────────────────────────────────────────
  // GOBLIN SYSTEM
  // ─────────────────────────────────────────────────────────────

  _spawnGoblins(groundLayer) {
    // Goblins are dropped from ABOVE the intended platform and gravity +
    // the Ground collider settle them onto the tiles. `platformY` is only
    // used to pick a drop height; it is never used as the final position.
    const DROP_HEIGHT = 80;
    const placements = [
      { x: 420, platformY: 224 },   // left platform area
      { x: 900, platformY: 288 },   // right cliff plateau
    ];

    placements.forEach(pos => {
      const g = this._createGoblin(pos.x, pos.platformY - DROP_HEIGHT, groundLayer);
      this.goblins.push(g);
    });
  }

  _goblinBarOffsetY() {
    // Health bar floats just above the goblin's head
    return -((GOBLIN_BODY_H + GOBLIN_FEET_PAD) * GOBLIN_SCALE) - 8;
  }

  _createGoblin(x, y, groundLayer) {
    const PATROL_SPEED = 55;
    const PATROL_RANGE = 90; // pixels left/right from spawn

    const goblin = this.physics.add.sprite(x, y, "goblin-idle", 0)
      .setOrigin(0.5, 1)
      .setScale(GOBLIN_SCALE)  // 480px frame scaled down to ~86px
      .setDepth(19);

    // Physics body — sized to the visible character (unscaled frame pixels).
    // Centered horizontally; bottom of body sits at the goblin's feet, which are
    // GOBLIN_FEET_PAD px above the bottom of the 480px frame.
    goblin.body.setSize(GOBLIN_BODY_W, GOBLIN_BODY_H, false);
    goblin.body.setOffset(GOBLIN_BODY_OFF_X, GOBLIN_BODY_OFF_Y);
    goblin.body.setGravityY(1000);
    goblin.body.setMaxVelocityY(800);
    goblin.body.setCollideWorldBounds(true);

    // Collide with ground
    this.physics.add.collider(goblin, groundLayer);

    // State
    goblin.hp = 2;          // takes 2 hits to kill
    goblin.isDying = false;
    goblin.isHurt = false;
    goblin.hurtTimer = 0;
    goblin.patrolDir = 1;          // 1=right, -1=left
    goblin.spawnX = x;
    goblin.patrolRange = PATROL_RANGE;
    goblin.patrolSpeed = PATROL_SPEED;

    // Attack state
    goblin.isAttacking = false;
    goblin.attackCooldown = 1.5;   // grace period after landing
    goblin.hasHitPlayer = false; // one hit per swing
    goblin._lastHitAttackId = -1;  // last player swing that damaged this goblin

    goblin.play("goblin-idle");

    // When the attack animation finishes, the swing is over
    goblin.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim.key === "goblin-attack" && !goblin.isDying) {
        goblin.isAttacking = false;
        goblin.attackCooldown = GOBLIN_ATTACK_COOLDOWN;
      }
    });

    // Health bar (world-space graphics that follow goblin)
    const barY = y + this._goblinBarOffsetY();
    const hpBg = this.add.rectangle(x, barY, 36, 5, 0x330000).setDepth(25);
    const hpBar = this.add.rectangle(x - 18, barY, 36, 5, 0x44ff44).setDepth(26).setOrigin(0, 0.5);
    goblin._hpBg = hpBg;
    goblin._hpBar = hpBar;

    // Overlap: ONLY the player's attack interacts here. Touching a goblin does
    // nothing — goblins hurt the player solely via their attack swing
    // (see _updateGoblins / _damagePlayer).
    this.physics.add.overlap(this.player, goblin, () => {
      if (
        this._isAttacking &&
        !this._isDead &&
        !goblin.isDying &&
        !goblin.isHurt &&
        goblin._lastHitAttackId !== this._attackId
      ) {
        goblin._lastHitAttackId = this._attackId;
        // If this goblin has a letter (word-game goblin), route through WordGame
        if (goblin.letter && this.wordGame) {
          this.wordGame.onStrike(goblin);
        } else {
          this._hitGoblin(goblin);
        }
      }
    });

    return goblin;
  }

  _syncGoblinBar(goblin) {
    const by = goblin.y + this._goblinBarOffsetY();
    goblin._hpBg.setPosition(goblin.x, by);
    goblin._hpBar.setPosition(goblin.x - 18, by);
  }

  _hitGoblin(goblin) {
    goblin.hp--;
    goblin.isHurt = true;
    goblin.hurtTimer = 0.35;

    // Interrupt any swing in progress
    goblin.isAttacking = false;
    goblin.attackCooldown = GOBLIN_ATTACK_COOLDOWN * 0.5;

    // Flash white
    goblin.setTint(0xffffff);
    goblin.play("goblin-hurt", true);

    // Update health bar
    const ratio = Math.max(0, goblin.hp / 2);
    goblin._hpBar.width = 36 * ratio;
    goblin._hpBar.fillColor = ratio > 0.5 ? 0x44ff44 : ratio > 0.25 ? 0xffaa00 : 0xff3333;

    this._spawnSparkles(goblin.x, goblin.y - 20, 0xff6622);
    this._showFloatingText(goblin.x, goblin.y - 30, `-1 ⚔️`, "#ff8833");

    if (goblin.hp <= 0) {
      this._killGoblin(goblin);
    } else {
      // Recover from hurt after a moment
      this.time.delayedCall(350, () => {
        if (!goblin.isDying && goblin.active) {
          goblin.isHurt = false;
          goblin.clearTint();
          goblin.play("goblin-idle", true);
        }
      });
    }
  }

  _killGoblin(goblin) {
    if (goblin.isDying) return;
    goblin.isDying = true;
    goblin.isAttacking = false;

    // Stop movement (body is disabled, so gravity no longer matters for a corpse)
    goblin.body.setVelocity(0, 0);
    goblin.body.enable = false;

    goblin.clearTint();
    goblin.play("goblin-dying", true);

    this._goblinKills++;
    this._showFloatingText(goblin.x, goblin.y - 40, "Goblin Slain! ☠️", "#a3f78c");
    this._spawnSparkles(goblin.x, goblin.y - 20, 0x33ff33);

    // Remove health bars and letter label immediately
    if (goblin._label?.active) goblin._label.destroy();
    goblin._hpBg.destroy();
    goblin._hpBar.destroy();

    // Fade and destroy after death animation
    this.tweens.add({
      targets: goblin,
      alpha: 0,
      delay: 900,
      duration: 500,
      onComplete: () => {
        const idx = this.goblins.indexOf(goblin);
        if (idx !== -1) this.goblins.splice(idx, 1);
        goblin.destroy();
      },
    });
  }

  _removeGoblinSilently(goblin) {
    // Used if a goblin somehow falls out of the world
    goblin.isDying = true;
    if (goblin._label?.active) goblin._label.destroy();
    if (goblin._hpBg?.active) goblin._hpBg.destroy();
    if (goblin._hpBar?.active) goblin._hpBar.destroy();
    const idx = this.goblins.indexOf(goblin);
    if (idx !== -1) this.goblins.splice(idx, 1);
    goblin.destroy();
  }

  // ─────────────────────────────────────────────────────────────
  // WORD GAME HELPERS  (called by WordGame class)
  // ─────────────────────────────────────────────────────────────

  /** Show a letter label floating above a goblin */
  _attachLetter(goblin, letter) {
    const style = {
      fontFamily: FONT,
      fontSize: "32px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#0e1a08",
      strokeThickness: 5,
    };
    const label = this.add.text(goblin.x, goblin.y - 50, letter.toUpperCase(), style)
      .setOrigin(0.5)
      .setDepth(30);
    goblin._label = label;

    // Keep the label above the goblin each frame
    const updateLabel = () => {
      if (!goblin.active || goblin.isDying) { label.destroy(); return; }
      label.setPosition(goblin.x, goblin.y + this._goblinBarOffsetY() - 14);
    };
    this.events.on("update", updateLabel);
    goblin.once("destroy", () => {
      this.events.off("update", updateLabel);
      if (label.active) label.destroy();
    });
  }

  /** Wrong-answer feedback: shake the goblin and flash red */
  _bonk(goblin) {
    goblin.setTint(0xff4444);
    this.tweens.add({
      targets: goblin,
      x: goblin.x + 8,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => goblin.clearTint(),
    });
  }

  // Is the player inside the goblin's current swing, and is the swing at its "hit" frames?
  _goblinSwingConnects(goblin) {
    const frameIdx = goblin.anims.currentFrame?.index ?? 0;
    if (frameIdx < GOBLIN_HIT_FRAME_MIN || frameIdx > GOBLIN_HIT_FRAME_MAX) return false;

    const gb = goblin.body;
    const facing = goblin.flipX ? 1 : -1;   // "Left" sheet faces left by default
    const reachX = facing === 1 ? gb.right : gb.left - GOBLIN_HIT_REACH;
    const swing = new Phaser.Geom.Rectangle(reachX, gb.top, GOBLIN_HIT_REACH, gb.height);

    const pb = this.player.body;
    const playerRect = new Phaser.Geom.Rectangle(pb.left, pb.top, pb.width, pb.height);
    return Phaser.Geom.Intersects.RectangleToRectangle(swing, playerRect);
  }

  _updateGoblins(dt) {
    [...this.goblins].forEach(goblin => {
      if (goblin.isDying || !goblin.active) return;

      // Fell out of the world (open bottom bound) -> clean up
      if (goblin.y > this._mapHeightPx + 100) {
        this._removeGoblinSilently(goblin);
        return;
      }

      goblin.attackCooldown = Math.max(0, goblin.attackCooldown - dt);
      const onGround = goblin.body.blocked.down;

      // ── Hurt: stand still ───────────────────────────────────
      if (goblin.isHurt) {
        goblin.hurtTimer -= dt;
        if (goblin.hurtTimer <= 0) {
          goblin.isHurt = false;
          goblin.clearTint();
        }
        goblin.body.setVelocityX(0);
        this._syncGoblinBar(goblin);
        return;
      }

      // ── Airborne: let gravity work, never walk ──────────────
      if (!onGround) {
        goblin.body.setVelocityX(0);
        if (!goblin.isAttacking && goblin.anims.currentAnim?.key !== "goblin-idle") {
          goblin.play("goblin-idle", true);
        }
        this._syncGoblinBar(goblin);
        return;
      }

      // ── Mid-swing: stand still, damage only on the hit frames ─
      if (goblin.isAttacking) {
        goblin.body.setVelocityX(0);
        if (
          !goblin.hasHitPlayer &&
          !this._isDead &&
          this._goblinSwingConnects(goblin)
        ) {
          goblin.hasHitPlayer = true;
          this._damagePlayer(goblin.x);
        }
        this._syncGoblinBar(goblin);
        return;
      }

      // ── Start a swing if the player is close and we're ready ─
      if (!this._isDead && goblin.attackCooldown <= 0) {
        const dx = this.player.x - goblin.x;
        const dy = Math.abs(this.player.body.bottom - goblin.body.bottom);
        if (Math.abs(dx) <= GOBLIN_ATTACK_RANGE && dy <= 40) {
          goblin.isAttacking = true;
          goblin.hasHitPlayer = false;
          goblin.body.setVelocityX(0);
          goblin.setFlipX(dx > 0);          // face the player
          goblin.play("goblin-attack", true);
          this._syncGoblinBar(goblin);
          return;
        }
      }

      // ── Stand guard (no patrolling): idle, face the player ──
      goblin.body.setVelocityX(0);
      if (!this._isDead) goblin.setFlipX(this.player.x > goblin.x);
      if (goblin.anims.currentAnim?.key !== "goblin-idle") {
        goblin.play("goblin-idle", true);
      }

      this._syncGoblinBar(goblin);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PLAYER DAMAGE
  // ─────────────────────────────────────────────────────────────

  _damagePlayer(sourceX) {
    if (this._isDead || this._isInvulnerable) return;

    this._playerHP = Math.max(0, this._playerHP - 1);

    // Invulnerability window
    this._isInvulnerable = true;
    this._invulnerabilityTimer = PLAYER_INVULN_SECONDS;

    // Small horizontal knockback away from the attacker
    const dir = this.player.x >= sourceX ? 1 : -1;
    this._knockbackTimer = PLAYER_KNOCKBACK_TIME;
    this._isAttacking = false;
    this._attackTimer = 0;
    if (this.player.body) this.player.body.setVelocityX(dir * PLAYER_KNOCKBACK_VX);

    // Flash: red tint + blinking alpha for the invulnerability window
    this._flashTween?.stop();
    this.player.setAlpha(1);
    this.player.setTint(0xff7777);
    this.time.delayedCall(200, () => {
      if (!this._isDead) this.player.clearTint();
    });
    this._flashTween = this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 100,
      yoyo: true,
      repeat: 7,                    // 8 blinks ≈ 1.6s
      onComplete: () => { if (!this._isDead) this.player.setAlpha(1); },
    });

    this._showFloatingText(
      this.player.x, this.player.y - 70,
      `-1 HP  ❤️ ${this._playerHP}/${PLAYER_MAX_HP}`, "#ff6666"
    );

    if (this._playerHP <= 0) {
      this._triggerDeath("💀 Slain!");
    }
  }

  // Water kills only when the player is genuinely IN a water tile (or has fallen
  // out of the map). Water tiles are looked up, never used as collision.
  _checkWater() {
    if (!this._waterLayer) return false;
    const body = this.player.body;

    const inWaterAt = (wx, wy) => {
      const tile = this._waterLayer.getTileAtWorldXY(wx, wy);
      return !!tile && tile.index !== -1;
    };

    // Body centre submerged -> always lethal
    if (inWaterAt(body.center.x, body.center.y)) return true;

    // Feet submerged AND not standing on solid ground -> lethal
    // (standing on a ground tile that happens to touch a water tile is safe)
    if (!body.blocked.down && inWaterAt(body.center.x, body.bottom - 4)) return true;

    return false;
  }

  update(time, delta) {
    if (!this.player || !this.cursors || this._isDead) return;

    const dt = Math.min(delta, 50) / 1000;
    this._updateGoblins(dt);

    // ── Invulnerability / knockback timers ─────────────────────
    if (this._isInvulnerable) {
      this._invulnerabilityTimer -= dt;
      if (this._invulnerabilityTimer <= 0) {
        this._isInvulnerable = false;
        this._invulnerabilityTimer = 0;
        this._flashTween?.stop();
        this._flashTween = null;
        this.player.setAlpha(1);
        this.player.clearTint();
      }
    }
    if (this._knockbackTimer > 0) this._knockbackTimer -= dt;

    // ── Constants ──────────────────────────────────────────────
    const WALK_SPEED = 160;   // px/s
    const RUN_MULT = 1.5;
    const JUMP_VEL = -700;  // px/s (negative = up)
    const ATTACK_DURATION = 0.4;  // seconds

    const body = this.player.body;
    const onGround = body.blocked.down;

    const left = this.cursors.left?.isDown;
    const right = this.cursors.right?.isDown;
    const up = this.cursors.up?.isDown;
    const down = this.cursors.down?.isDown;
    const shift = this._keyShift?.isDown;
    const spaceJustDown = Phaser.Input.Keyboard.JustDown(this._keySpace);

    // ── Water: only when actually inside a water tile ──────────
    if (this._checkWater()) {
      this._triggerDeath("💀 Drowned!");
      return;
    }

    // ── Death zone: fell below map ──────────────────────────────
    if (this.player.y > this._mapHeightPx + 64) {
      this._triggerDeath();
      return;
    }

    // ── Attack ─────────────────────────────────────────────────
    if (spaceJustDown && !this._isAttacking) {
      this._isAttacking = true;
      this._attackTimer = ATTACK_DURATION;
      this._attackId++;
      this.player.play("boy-attack", true);
    }
    if (this._isAttacking) {
      this._attackTimer -= dt;
      if (this._attackTimer <= 0) this._isAttacking = false;
    }

    // ── Horizontal velocity ────────────────────────────────────
    const knockedBack = this._knockbackTimer > 0;
    const maxSpeed = WALK_SPEED * (shift ? RUN_MULT : 1);
    let vx = 0;
    if (!this._isAttacking) {
      if (left) vx = -maxSpeed;
      if (right) vx = maxSpeed;
    }
    if (!knockedBack) body.setVelocityX(vx);

    // Flip sprite
    if (!knockedBack) {
      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);
    }

    // ── Jump ───────────────────────────────────────────────────
    if (up && onGround && !this._isAttacking && !knockedBack) {
      body.setVelocityY(JUMP_VEL);
    }

    // ── Crouch ─────────────────────────────────────────────────
    this._isCrouching = down && onGround;

    // ── Animation state machine ────────────────────────────────
    if (!this._isAttacking) {
      if (!onGround) {
        if (this.player.anims.currentAnim?.key !== "boy-jump") {
          this.player.play("boy-jump", true);
        }
      } else if (this._isCrouching) {
        this.player.play("boy-crouch", true);
      } else if (Math.abs(vx) > 1) {
        const movAnim = (shift && Math.abs(vx) > WALK_SPEED * 0.9) ? "boy-run" : "boy-walk";
        if (this.player.anims.currentAnim?.key !== movAnim) {
          this.player.play(movAnim, true);
        }
      } else {
        if (this.player.anims.currentAnim?.key !== "boy-idle") {
          this.player.play("boy-idle", true);
        }
      }
    }
  }

  _triggerDeath(label = "💀 Fell!") {
    if (this._isDead) return;
    this._isDead = true;

    // Cancel any damage-flash so it can't fight the death tween
    this._flashTween?.stop();
    this._flashTween = null;
    this._isInvulnerable = false;
    this._invulnerabilityTimer = 0;
    this._knockbackTimer = 0;
    this.player.setAlpha(1);
    this.player.clearTint();

    // Stop the player
    if (this.player.body) {
      this.player.body.setVelocity(0, 0);
      this.player.body.setGravityY(0);
    }

    // Flash red then fade out
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      tint: 0xff2222,
      duration: 400,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this._respawn();
      },
    });

    this._showFloatingText(
      this.player.x, this.player.y - 20,
      label, "#ff4444"
    );
  }

  _respawn() {
    this._isDead = false;
    this._isAttacking = false;
    this._attackTimer = 0;
    this._isCrouching = false;

    // Restore health; brief grace period so a nearby goblin can't instantly re-hit
    this._playerHP = PLAYER_MAX_HP;
    this._isInvulnerable = true;
    this._invulnerabilityTimer = PLAYER_INVULN_SECONDS;
    this._knockbackTimer = 0;

    this.player.setAlpha(1);
    this.player.clearTint();
    this.player.setPosition(this._spawnX, this._spawnY);

    if (this.player.body) {
      this.player.body.setVelocity(0, 0);
      this.player.body.setGravityY(1000);
    }

    this.player.play("boy-idle", true);

    // Re-attach camera follow in case it was detached
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(0, 80);
  }

  _createHUD() {
    const W = this.scale.width;

    // 1. Back to Map Button (Top Left)
    const backBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    backBg.fillStyle(0x0e1a08, 0.85);
    backBg.lineStyle(2, 0x4a7a28, 1);
    backBg.fillRoundedRect(20, 20, 140, 42, 10);
    backBg.strokeRoundedRect(20, 20, 140, 42, 10);

    const backBtn = this.add.text(32, 31, "← Back to Map", {
      fontFamily: FONT,
      fontSize: "16px",
      fontWeight: "bold",
      color: "#e8f5c0",
    }).setDepth(51).setScrollFactor(0).setInteractive({ useHandCursor: true });

    backBtn.on("pointerover", () => {
      backBtn.setColor("#ffffff");
      backBg.lineStyle(2, 0x88d440, 1);
      backBg.strokeRoundedRect(20, 20, 140, 42, 10);
    });
    backBtn.on("pointerout", () => {
      backBtn.setColor("#e8f5c0");
      backBg.lineStyle(2, 0x4a7a28, 1);
      backBg.strokeRoundedRect(20, 20, 140, 42, 10);
    });
    backBtn.on("pointerdown", () => {
      window.location.href = "/map";
    });

    // 2. Level Header (Top Center)
    const headerBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    headerBg.fillStyle(0x0e1a08, 0.9);
    headerBg.lineStyle(2, 0x5a8c30, 1);
    headerBg.fillRoundedRect(W / 2 - 170, 14, 340, 54, 12);
    headerBg.strokeRoundedRect(W / 2 - 170, 14, 340, 54, 12);

    this.add.text(W / 2, 24, "Level 1: Mossy Start", {
      fontFamily: TITLE_FONT,
      fontSize: "26px",
      color: "#e8f5c0",
      stroke: "#1a2e10",
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(51).setScrollFactor(0);

    this.add.text(W / 2, 50, "Swamp Bayou • Platform Environment", {
      fontFamily: FONT,
      fontSize: "12px",
      fontWeight: "bold",
      color: "#9acc6e",
    }).setOrigin(0.5, 0).setDepth(51).setScrollFactor(0);

    // 3. Stats HUD (Top Right: Coins, Runes, Keys)
    const hudBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    hudBg.fillStyle(0x0e1a08, 0.85);
    hudBg.lineStyle(2, 0x4a7a28, 1);
    hudBg.fillRoundedRect(W - 320, 20, 300, 42, 10);
    hudBg.strokeRoundedRect(W - 320, 20, 300, 42, 10);

    this.coinsText = this.add.text(W - 305, 32, "🪙 Coins: 0", {
      fontFamily: FONT,
      fontSize: "15px",
      fontWeight: "bold",
      color: "#ffd700",
    }).setDepth(51).setScrollFactor(0);

    this.runesText = this.add.text(W - 195, 32, "🌿 Runes: 0/2", {
      fontFamily: FONT,
      fontSize: "15px",
      fontWeight: "bold",
      color: "#a3f78c",
    }).setDepth(51).setScrollFactor(0);

    this.keysText = this.add.text(W - 85, 32, "🗝️ 0/2", {
      fontFamily: FONT,
      fontSize: "15px",
      fontWeight: "bold",
      color: "#7df9ff",
    }).setDepth(51).setScrollFactor(0);

    // 4. Camera Zoom & Navigation Hint (Bottom Right)
    const hintBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    hintBg.fillStyle(0x0e1a08, 0.85);
    hintBg.fillRoundedRect(W - 390, 670, 370, 36, 8);

    this.add.text(W - 205, 688, "🖱️ Drag to Pan  •  ←→ Move  •  ↑ Jump  •  ↓ Crouch  •  Shift Run  •  Space Attack", {
      fontFamily: FONT,
      fontSize: "11px",
      color: "#c2e88a",
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    // Zoom Buttons (well positioned from edge)
    this._createZoomButton(W - 130, 625, "＋", 1.25);
    this._createZoomButton(W - 85, 625, "－", 0.85);
    this._createZoomButton(W - 40, 625, "⟲", 1.0);
  }

  _createZoomButton(x, y, label, targetZoom) {
    const btnBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    btnBg.fillStyle(0x13240e, 0.95);
    btnBg.lineStyle(1.5, 0x5a8c30, 1);
    btnBg.fillRoundedRect(x - 18, y - 18, 36, 36, 8);
    btnBg.strokeRoundedRect(x - 18, y - 18, 36, 36, 8);

    const txt = this.add.text(x, y, label, {
      fontFamily: FONT,
      fontSize: "17px",
      fontWeight: "bold",
      color: "#f0fbdb",
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setInteractive({ useHandCursor: true });

    txt.on("pointerover", () => {
      txt.setColor("#ffffff");
      btnBg.clear();
      btnBg.fillStyle(0x28471c, 1);
      btnBg.lineStyle(1.5, 0x88d440, 1);
      btnBg.fillRoundedRect(x - 18, y - 18, 36, 36, 8);
      btnBg.strokeRoundedRect(x - 18, y - 18, 36, 36, 8);
    });

    txt.on("pointerout", () => {
      txt.setColor("#f0fbdb");
      btnBg.clear();
      btnBg.fillStyle(0x13240e, 0.95);
      btnBg.lineStyle(1.5, 0x5a8c30, 1);
      btnBg.fillRoundedRect(x - 18, y - 18, 36, 36, 8);
      btnBg.strokeRoundedRect(x - 18, y - 18, 36, 36, 8);
    });

    txt.on("pointerdown", () => {
      this.cameras.main.zoomTo(targetZoom, 250, "Sine.easeInOut");
    });
  }

  _updateHUD() {
    if (this.coinsText) {
      this.coinsText.setText(`🪙 Coins: ${this.coinsCollected}`);
    }
    if (this.runesText) {
      this.runesText.setText(`🌿 Runes: ${this.runesCollected}/${this.totalRunes}`);
    }
    if (this.keysText) {
      this.keysText.setText(`🗝️ ${this.keysCollected}/${this.totalKeys}`);
    }
  }
}