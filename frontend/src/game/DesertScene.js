import Phaser from "phaser";
import { DesertSyllableGame } from "./DesertSyllableGame";

const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";
const HIGHLIGHT_ANSWER = false;
// ── Asset paths ──────────────────────────────────────────────
const DESERT_BG_PATH  = "/game-assests/desert/bg/background.png";
const DESERT_BG_LAYERS = [
  "/game-assests/desert/bg/1.png",
  "/game-assests/desert/bg/2.png",
  "/game-assests/desert/bg/3.png",
  "/game-assests/desert/bg/4.png",
  "/game-assests/desert/bg/5.png",
];

const VULTURE_PATH = "/game-assests/desert/Vulture";

// ── Tuning ───────────────────────────────────────────────────
const GROUND_RATIO     = 0.87;
const WORLD_SCREENS    = 3;
const SYLLABLE_CHIP_W  = 90;
const SYLLABLE_CHIP_H  = 48;
const COLLECT_DISTANCE  = 50;   // px overlap to collect a syllable

export default class DesertScene extends Phaser.Scene {
  constructor() {
    super("DesertScene");
    this._isAttacking = false;
    this._attackTimer  = 0;
  }

  // ── Receives data from SwampScene: { score, level, from } ──
  init(data) {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const urlScore = params ? parseInt(params.get("score") || "0", 10) : 0;
    const urlLevel = params ? parseInt(params.get("level") || "1", 10) : 1;

    this.carry = {
      score: data?.score ?? urlScore ?? 0,
      level: data?.level ?? urlLevel ?? 1,
      from:  data?.from  ?? "swamp",
    };
  }

  preload() {
    // Desert backgrounds
    this.load.image("desert-bg", DESERT_BG_PATH);
    DESERT_BG_LAYERS.forEach((path, i) => {
      const key = `desert-layer-${i + 1}`;
      if (!this.textures.exists(key)) this.load.image(key, path);
    });

    // Player sprite sheets
    const P = "/game-assests/character/boy";
    const sheets = [
      ["player-boy-idle",   "Idle.png"],
      ["player-boy-walk",   "Walk.png"],
      ["player-boy-run",    "Run.png"],
      ["player-boy-jump",   "Jump.png"],
      ["player-boy-attack", "Attack_1.png"],
    ];
    sheets.forEach(([key, file]) => {
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, `${P}/${file}`, { frameWidth: 128, frameHeight: 128 });
      }
    });

    // Vulture sprite sheets (48x48 per frame)
    const vultureSheets = [
      ["vulture-idle",   "Vulture_idle.png",   4],
      ["vulture-walk",   "Vulture_walk.png",   4],
      ["vulture-attack", "Vulture_attack.png", 4],
      ["vulture-hurt",   "Vulture_hurt.png",   2],
      ["vulture-death",  "Vulture_death.png",  4],
    ];
    vultureSheets.forEach(([key, file, _frames]) => {
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, `${VULTURE_PATH}/${file}`, {
          frameWidth: 48,
          frameHeight: 48,
        });
      }
    });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const worldW  = W * WORLD_SCREENS;
    const groundY = Math.round(H * GROUND_RATIO);
    this._groundY = groundY;
    this._isAttacking = false;
    this._syllableChips = [];
    this._wordSlots = [];
    this._hudElements = [];
    this._gameActive = false;

    this._ensureAnimations();

    // ── World / camera ───────────────────────────────────────
    this.physics.world.setBounds(0, 0, worldW, H);
    this.cameras.main.setBounds(0, 0, worldW, H);
    this.cameras.main.fadeIn(600);

    // ── Parallax backgrounds ─────────────────────────────────
    this._createParallax(worldW, H);

    // ── Invisible ground ─────────────────────────────────────
    const ground = this.add.rectangle(worldW / 2, groundY + 20, worldW, 40, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this._ground = ground;

    // ── Player ───────────────────────────────────────────────
    this.player = this.physics.add.sprite(200, groundY - 4, "player-boy-idle", 0)
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setDepth(20);

    this.player.body.setSize(30, 60);
    this.player.body.setOffset(49, 68);
    this.player.body.setGravityY(1000);
    this.player.body.setMaxVelocityY(800);
    this.player.body.setCollideWorldBounds(true);
    this.player.play("boy-idle");

    this.physics.add.collider(this.player, ground);

    // ── Camera follow ────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Input ────────────────────────────────────────────────
    this.cursors    = this.input.keyboard.createCursorKeys();
    this._keyShift  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this._keySpace  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Desert atmosphere: floating sand particles ───────────
    this._createDesertAtmosphere(worldW, H, groundY);

    // ── HUD ──────────────────────────────────────────────────
    this._createHUD(W);

    // ── Start the syllable game ──────────────────────────────
    this.syllableGame = new DesertSyllableGame(this);
    this.syllableGame.start(this.carry.level);
  }

  // ═══════════════════════════════════════════════════════════
  // PARALLAX BACKGROUND
  // ═══════════════════════════════════════════════════════════

  _createParallax(worldW, H) {
    const scrollFactors = [0.05, 0.15, 0.3, 0.5, 0.75];
    let hasLayers = false;

    // Use separate parallax layers 1 to 5
    for (let i = 0; i < 5; i++) {
      const key = `desert-layer-${i + 1}`;
      if (this.textures.exists(key)) {
        hasLayers = true;
        const layerH = this.textures.get(key).getSourceImage().height;
        const ls = H / layerH;
        this.add.tileSprite(0, 0, worldW / ls, layerH, key)
          .setOrigin(0, 0)
          .setScale(ls)
          .setScrollFactor(scrollFactors[i], 1)
          .setDepth(i);
      }
    }

    // Fallback if individual layers are missing
    if (!hasLayers && this.textures.exists("desert-bg")) {
      const bgH = this.textures.get("desert-bg").getSourceImage().height;
      const s = H / bgH;
      this.add.tileSprite(0, 0, worldW / s, bgH, "desert-bg")
        .setOrigin(0, 0)
        .setScale(s)
        .setScrollFactor(0.2, 1)
        .setDepth(0);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DESERT ATMOSPHERE
  // ═══════════════════════════════════════════════════════════

  _createDesertAtmosphere(worldW, H, groundY) {
    // Floating dust / sand particles
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(50, worldW - 50);
      const y = Phaser.Math.Between(80, groundY - 30);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.45);
      const color = Phaser.Math.RND.pick([0xf5deb3, 0xdeb887, 0xd2b48c, 0xfae3b0]);

      const particle = this.add.circle(x, y, size, color, alpha).setDepth(6);
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-60, 60),
        y: y + Phaser.Math.Between(-20, 20),
        alpha: { from: alpha * 0.5, to: alpha },
        scale: { from: 0.7, to: 1.4 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Heat shimmer effect (subtle wavy rectangles near ground)
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(100, worldW - 100);
      const shimmer = this.add.rectangle(x, groundY - 5, Phaser.Math.Between(80, 200), 3, 0xffffff, 0.06)
        .setDepth(7);
      this.tweens.add({
        targets: shimmer,
        scaleX: { from: 0.8, to: 1.3 },
        alpha: { from: 0.03, to: 0.08 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════

  _ensureAnimations() {
    // Player animations
    const defs = [
      { key: "boy-idle",   texture: "player-boy-idle",   end: 5, rate: 8,  repeat: -1 },
      { key: "boy-walk",   texture: "player-boy-walk",   end: 7, rate: 10, repeat: -1 },
      { key: "boy-run",    texture: "player-boy-run",    end: 7, rate: 14, repeat: -1 },
      { key: "boy-jump",   texture: "player-boy-jump",   end: 5, rate: 10, repeat: 0  },
      { key: "boy-attack", texture: "player-boy-attack", end: 3, rate: 12, repeat: 0  },
    ];
    defs.forEach(({ key, texture, end, rate, repeat }) => {
      try {
        if (!this.anims.exists(key) && this.textures.exists(texture)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end }),
            frameRate: rate,
            repeat,
          });
        }
      } catch (e) {
        // ignore
      }
    });

    // Vulture animations
    const vultureAnims = [
      { key: "vulture-idle-anim",   texture: "vulture-idle",   end: 3, rate: 6,  repeat: -1 },
      { key: "vulture-walk-anim",   texture: "vulture-walk",   end: 3, rate: 8,  repeat: -1 },
      { key: "vulture-attack-anim", texture: "vulture-attack", end: 3, rate: 10, repeat: 0  },
      { key: "vulture-hurt-anim",   texture: "vulture-hurt",   end: 1, rate: 6,  repeat: 0  },
      { key: "vulture-death-anim",  texture: "vulture-death",  end: 3, rate: 6,  repeat: 0  },
    ];
    vultureAnims.forEach(({ key, texture, end, rate, repeat }) => {
      try {
        if (!this.anims.exists(key) && this.textures.exists(texture)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end }),
            frameRate: rate,
            repeat,
          });
        }
      } catch (e) {
        // ignore
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════

  _createHUD(W) {
    // Header bar
    const bg = this.add.graphics().setScrollFactor(0).setDepth(50);
    bg.fillStyle(0x3a2a10, 0.88).fillRoundedRect(W / 2 - 200, 10, 400, 56, 14);
    bg.lineStyle(2, 0xd9a441, 1).strokeRoundedRect(W / 2 - 200, 10, 400, 56, 14);

    this.add.text(W / 2, 20, "🏜️ Desert Syllable Trail", {
      fontFamily: FONT, fontSize: "20px", fontStyle: "bold", color: "#fff1c9",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    this._progressText = this.add.text(W / 2, 44, "", {
      fontFamily: FONT, fontSize: "12px", fontStyle: "bold", color: "#f2cf85",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Score
    this._scoreText = this.add.text(W - 30, 20, `⭐ ${this.carry.score}`, {
      fontFamily: FONT, fontSize: "20px", fontStyle: "bold", color: "#ffd700",
      stroke: "#3a2a10", strokeThickness: 4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // Speaker button
    this._speakerBtn = this.add.text(W - 30, 50, "🔊", {
      fontFamily: FONT, fontSize: "24px",
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.syllableGame?.speak());

    // Back to map
    const back = this.add.text(24, 24, "← Map", {
      fontFamily: FONT, fontSize: "15px", fontStyle: "bold", color: "#fff1c9",
      backgroundColor: "#3a2a10", padding: { x: 10, y: 7 },
    }).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => { window.location.href = "/map"; });

    // Instruction text at bottom
    const hintBg = this.add.graphics().setDepth(50).setScrollFactor(0);
    hintBg.fillStyle(0x3a2a10, 0.8).fillRoundedRect(W / 2 - 240, 686, 480, 28, 6);
    this.add.text(W / 2, 700, "←→ Move  •  ↑ Jump  •  Shift Run  •  Walk onto syllables to collect!", {
      fontFamily: FONT, fontSize: "11px", color: "#f2cf85",
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);
  }

  _updateScore() {
    const total = this.carry.score + (this.syllableGame?.getScore() ?? 0);
    if (this._scoreText) this._scoreText.setText(`⭐ ${total}`);
  }

  // ═══════════════════════════════════════════════════════════
  // SYLLABLE GAME – SCENE INTERFACE
  // ═══════════════════════════════════════════════════════════

  /**
   * Called by DesertSyllableGame.nextRound().
   * 1. Show the target word at the top.
   * 2. Play the audio.
   * 3. Vulture swoops in and "smashes" the word.
   * 4. Syllables scatter around the desert.
   * 5. Highlight the first expected syllable.
   */
  _startSyllableRound(word, syllables) {
    this._gameActive = false;
    this._clearSyllableChips();
    this._clearWordSlots();

    // Update progress
    const roundNum = (this.syllableGame?.rounds?.length ?? 0) + 1;
    if (this._progressText) {
      this._progressText.setText(`Round ${roundNum} • Level ${this.syllableGame?.level ?? 1}`);
    }

    // Reset player position for new round
    this.player.setPosition(200, this._groundY - 4);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Fade camera in smoothly
    this.cameras.main.fadeIn(400);

    const W = this.scale.width;

    // ── Step 1: Show the whole target word IMMEDIATELY ─────
    this._wordDisplay = this.add.text(W / 2, 130, word.toUpperCase(), {
      fontFamily: FONT,
      fontSize: "56px",
      fontStyle: "bold",
      color: "#fff8dc",
      stroke: "#5a3a10",
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: "#00000066", blur: 4, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55).setScale(0);

    // Fast pop-in animation (300ms)
    this.tweens.add({
      targets: this._wordDisplay,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    // ── Step 2: Speak word ────────────────────────────
    try {
      this.syllableGame?.speak(true);
    } catch (e) {
      // ignore
    }

    // ── Step 3: Vulture swoops in after 700ms ────────
    this.time.delayedCall(700, () => {
      this._vultureSmash(word, syllables);
    });

    // ── Safety Fallback: Guarantee syllables scatter if vulture sequence stalls ──
    this.time.delayedCall(2000, () => {
      if (this._syllableChips.length === 0) {
        if (this._wordDisplay) {
          this._wordDisplay.destroy();
          this._wordDisplay = null;
        }
        this._createWordSlots(syllables);
        this._scatterSyllables(syllables);
      }
    });
  }

  /**
   * Vulture swoops in from the right, attacks the word, and word
   * explodes into syllable pieces that scatter across the desert ground.
   */
  _vultureSmash(word, syllables) {
    const W = this.scale.width;
    const H = this.scale.height;

    // Create the vulture (large scale for drama)
    const vulture = this.add.sprite(W + 80, 90, "vulture-idle", 0)
      .setScale(3)
      .setFlipX(true)
      .setScrollFactor(0)
      .setDepth(56);

    try {
      vulture.play("vulture-walk-anim");
    } catch (e) {}

    // Swoop in toward the word (500ms)
    this.tweens.add({
      targets: vulture,
      x: W / 2 + 40,
      y: 100,
      duration: 500,
      ease: "Quad.easeOut",
      onComplete: () => {
        try { vulture.play("vulture-attack-anim"); } catch (e) {}

        // Screen shake
        this.cameras.main.shake(200, 0.008);

        // Word shatters (150ms)
        this.time.delayedCall(150, () => {
          this._shatterWord(word, syllables);

          // Vulture flies away
          this.time.delayedCall(300, () => {
            try { vulture.play("vulture-walk-anim"); } catch (e) {}
            vulture.setFlipX(false);
            this.tweens.add({
              targets: vulture,
              x: W + 100,
              y: -60,
              duration: 700,
              ease: "Quad.easeIn",
              onComplete: () => vulture.destroy(),
            });
          });
        });
      },
    });
  }

  /**
   * Shatters the displayed word into syllable pieces with a dramatic effect,
   * then scatters physical syllable chips on the ground.
   */
  _shatterWord(word, syllables) {
    const W = this.scale.width;
    const H = this.scale.height;

    // Destroy the big word display with an explosion effect
    if (this._wordDisplay) {
      // Create letter shards that fly outward
      const text = this._wordDisplay.text;
      const startX = this._wordDisplay.x - (text.length * 14);
      for (let i = 0; i < text.length; i++) {
        const shard = this.add.text(startX + i * 28, this._wordDisplay.y, text[i], {
          fontFamily: FONT, fontSize: "48px", fontStyle: "bold",
          color: "#ffa500", stroke: "#5a3a10", strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(57);

        this.tweens.add({
          targets: shard,
          x: shard.x + Phaser.Math.Between(-120, 120),
          y: shard.y + Phaser.Math.Between(-80, 150),
          angle: Phaser.Math.Between(-180, 180),
          alpha: 0,
          scale: 0.3,
          duration: Phaser.Math.Between(400, 700),
          ease: "Quad.easeOut",
          onComplete: () => shard.destroy(),
        });
      }
      this._wordDisplay.destroy();
      this._wordDisplay = null;
    }

    // Create the reconstruction slots at the top
    this._createWordSlots(syllables);

    // Scatter syllable chips across the desert ground after a brief delay
    this.time.delayedCall(300, () => {
      this._scatterSyllables(syllables);
    });
  }

  /**
   * Creates the top-of-screen slots showing which syllables have been collected.
   * Unfilled slots show as dim underscores, filled ones show the syllable text.
   */
  _createWordSlots(syllables) {
    this._clearWordSlots();

    const W = this.scale.width;
    const totalWidth = syllables.length * (SYLLABLE_CHIP_W + 12);
    const startX = W / 2 - totalWidth / 2 + SYLLABLE_CHIP_W / 2;

    const targetWord = this.syllableGame?.round?.word?.toUpperCase() || "";
    this._targetHintText = this.add.text(W / 2, 70, `Target: ${targetWord}`, {
      fontFamily: FONT, fontSize: "14px", fontStyle: "bold", color: "#f2cf85",
      stroke: "#3a2a10", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(54);

    syllables.forEach((syl, i) => {
      // Slot background
      const slotBg = this.add.graphics().setScrollFactor(0).setDepth(52);
      slotBg.fillStyle(0x3a2a10, 0.7).fillRoundedRect(
        startX + i * (SYLLABLE_CHIP_W + 12) - SYLLABLE_CHIP_W / 2,
        86,
        SYLLABLE_CHIP_W,
        SYLLABLE_CHIP_H,
        10
      );
      slotBg.lineStyle(2, 0x8b6914, 0.6).strokeRoundedRect(
        startX + i * (SYLLABLE_CHIP_W + 12) - SYLLABLE_CHIP_W / 2,
        86,
        SYLLABLE_CHIP_W,
        SYLLABLE_CHIP_H,
        10
      );

      // Slot text (initially just "___")
      const slotText = this.add.text(
        startX + i * (SYLLABLE_CHIP_W + 12),
        110,
        "___",
        {
          fontFamily: FONT, fontSize: "22px", fontStyle: "bold",
          color: "#8b6914", align: "center",
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(53);

      this._wordSlots.push({ bg: slotBg, text: slotText, filled: false, syllable: syl });
    });
  }

  _clearWordSlots() {
    if (this._targetHintText) {
      this._targetHintText.destroy();
      this._targetHintText = null;
    }
    this._wordSlots.forEach((slot) => {
      slot.bg?.destroy();
      slot.text?.destroy();
    });
    this._wordSlots = [];
  }

  /**
   * Scatter syllable chips on the desert ground for the hero to collect.
   * Also adds distractor syllables to increase challenge.
   */
  _scatterSyllables(syllables) {
    this._clearSyllableChips();

    const groundY = this._groundY;
    const W = this.scale.width;
    const cam = this.cameras.main;

    // Generate scatter positions on the ground (world coords)
    // Spread syllables across the visible area + a bit beyond
    const baseX = this.player.x;
    const spacing = 180;
    const positions = [];

    // Create positions for real syllables + distractors
    const distractors = this._generateDistractors(syllables);
    const allChips = [
      ...syllables.map((s) => ({ text: s, isReal: true })),
      ...distractors.map((s) => ({ text: s, isReal: false })),
    ];

    // Shuffle the positions
    Phaser.Utils.Array.Shuffle(allChips);

    // Place them spread out on the ground
    const totalChips = allChips.length;
    const totalSpread = totalChips * spacing;
    const startXWorld = baseX + 150;

    allChips.forEach((chip, i) => {
      const x = startXWorld + i * spacing + Phaser.Math.Between(-20, 20);
      const y = groundY - SYLLABLE_CHIP_H / 2 - 8;

      this._createSyllableChip(chip.text, x, y, chip.isReal);
    });

    // Highlight the first expected syllable
    this._highlightExpectedSyllable();

    // Tell the game logic that scattering is complete
    this.syllableGame.onScatterComplete();
    this._gameActive = true;
  }

  _generateDistractors(syllables) {
    const distractorPool = [
      "ba", "be", "bi", "bo", "bu",
      "ca", "ce", "ci", "co", "cu",
      "da", "de", "di", "do", "du",
      "fa", "fe", "fi", "fo", "fu",
      "ga", "ge", "gi", "go", "gu",
      "la", "le", "li", "lo", "lu",
      "ma", "me", "mi", "mo", "mu",
      "na", "ne", "ni", "no", "nu",
      "pa", "pe", "pi", "po", "pu",
      "ra", "re", "ri", "ro", "ru",
      "sa", "se", "si", "so", "su",
      "ta", "te", "ti", "to", "tu",
      "ble", "ple", "tle", "ful", "ment",
      "tion", "sion", "ness", "ing", "ous",
    ];

    // Pick 2-3 distractors that aren't in the real syllables
    const filtered = distractorPool.filter(
      (d) => !syllables.some((s) => s.toLowerCase() === d.toLowerCase())
    );
    Phaser.Utils.Array.Shuffle(filtered);
    const count = Math.min(syllables.length, 3);
    return filtered.slice(0, count);
  }

  /**
   * Creates a single interactive syllable chip on the desert floor.
   */
  _createSyllableChip(text, worldX, worldY, isReal) {
    const container = this.add.container(worldX, worldY).setDepth(18);

    // Chip background (rounded rectangle via graphics)
    const gfx = this.add.graphics();
    gfx.fillStyle(0xf5deb3, 1);
    gfx.fillRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);
    gfx.lineStyle(3, 0x8b6914, 1);
    gfx.strokeRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);
    container.add(gfx);

    // Syllable text
    const label = this.add.text(0, 0, text.toUpperCase(), {
      fontFamily: FONT, fontSize: "22px", fontStyle: "bold",
      color: "#5a3a10", align: "center",
    }).setOrigin(0.5);
    container.add(label);

    // Gentle bob
    this.tweens.add({
      targets: container,
      y: worldY - 5,
      duration: 1200 + Math.random() * 400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Drop-in animation
    container.setScale(0);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 400,
      delay: Phaser.Math.Between(0, 300),
      ease: "Back.easeOut",
    });

    // Glow ring for highlighting
    const glow = this.add.graphics();
    container.add(glow);
    container.sendToBack(glow);

    const chipData = {
      container,
      gfx,
      label,
      glow,
      text,
      isReal,
      collected: false,
      highlighted: false,
      worldX,
      worldY,
    };

    this._syllableChips.push(chipData);
    return chipData;
  }

  _clearSyllableChips() {
    this._syllableChips.forEach((chip) => {
      chip.container?.destroy();
    });
    this._syllableChips = [];
  }

  /**
   * Highlights the chip(s) matching the next expected syllable.
   * Also dims any distractor or already-collected chips.
   */
  _highlightExpectedSyllable() {
    
  if (!HIGHLIGHT_ANSWER) return;
  const expected = this.syllableGame?.getExpectedSyllable();
  // ...rest unchanged
    if (!expected) return;

    this._syllableChips.forEach((chip) => {
      if (chip.collected) return;

      // Clear old highlights
      chip.glow.clear();

      if (chip.text.toLowerCase() === expected.toLowerCase() && chip.isReal) {
        // Highlight: glowing ring
        chip.highlighted = true;
        chip.glow.lineStyle(4, 0xffd700, 0.9);
        chip.glow.strokeRoundedRect(
          -SYLLABLE_CHIP_W / 2 - 4, -SYLLABLE_CHIP_H / 2 - 4,
          SYLLABLE_CHIP_W + 8, SYLLABLE_CHIP_H + 8, 14
        );

        // Pulsing glow tween
        if (chip._glowTween) chip._glowTween.stop();
        chip._glowTween = this.tweens.add({
          targets: chip.glow,
          alpha: { from: 0.5, to: 1 },
          duration: 600,
          yoyo: true,
          repeat: -1,
        });

        // Arrow indicator above
        if (!chip._arrow) {
          chip._arrow = this.add.text(0, -SYLLABLE_CHIP_H / 2 - 22, "▼", {
            fontFamily: FONT, fontSize: "20px", color: "#ffd700",
          }).setOrigin(0.5);
          chip.container.add(chip._arrow);

          this.tweens.add({
            targets: chip._arrow,
            y: -SYLLABLE_CHIP_H / 2 - 14,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      } else {
        chip.highlighted = false;
        if (chip._arrow) {
          chip._arrow.destroy();
          chip._arrow = null;
        }
        if (chip._glowTween) {
          chip._glowTween.stop();
          chip._glowTween = null;
        }
      }
    });
  }

  /**
   * Check if the player has walked onto a syllable chip.
   */
  _checkSyllableCollisions() {
    if (!this._gameActive || !this.syllableGame) return;

    const px = this.player.x;
    const py = this.player.body.bottom;

    this._syllableChips.forEach((chip) => {
      if (chip.collected) return;

      const dx = Math.abs(px - chip.worldX);
      const dy = Math.abs(py - chip.worldY - SYLLABLE_CHIP_H / 2);

      if (dx < COLLECT_DISTANCE && dy < COLLECT_DISTANCE + 15) {
        // Player is touching this chip
        const result = this.syllableGame.onCollect(chip.text);

        if (result.correct) {
          this._collectChipAnimation(chip);
          if (!result.done) {
            this._highlightExpectedSyllable();
          }
        } else {
          this._wrongChipAnimation(chip);
        }
      }
    });
  }

  /**
   * Animate a correct syllable collection: chip flies up to the word slot.
   */
  _collectChipAnimation(chip) {
    chip.collected = true;
    this._gameActive = false; // briefly pause to avoid double-collect

    // Find the corresponding slot
    const slotIndex = this.syllableGame.currentIndex - 1; // just collected
    const slot = this._wordSlots[slotIndex];

    // Camera coords of the slot
    const cam = this.cameras.main;
    const chipScreenX = chip.worldX - cam.worldView.x;
    const chipScreenY = chip.worldY - cam.worldView.y;

    // Create a flying copy
    const flyText = this.add.text(chipScreenX, chipScreenY, chip.text.toUpperCase(), {
      fontFamily: FONT, fontSize: "24px", fontStyle: "bold",
      color: "#ffd700", stroke: "#5a3a10", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);

    // Hide original chip
    chip.container.setVisible(false);

    // Sparkles from collection
    this._spawnSparkles(chip.worldX, chip.worldY, 0xffd700);

    // Fly to the slot position
    if (slot) {
      const targetX = slot.text.x;
      const targetY = slot.text.y;

      this.tweens.add({
        targets: flyText,
        x: targetX,
        y: targetY,
        scale: 1.2,
        duration: 500,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          flyText.destroy();

          // Fill the slot
          slot.text.setText(chip.text.toUpperCase());
          slot.text.setColor("#ffd700");
          slot.filled = true;

          // Slot pop animation
          this.tweens.add({
            targets: slot.text,
            scale: 1.4,
            duration: 150,
            yoyo: true,
            repeat: 1,
          });

          // Re-draw slot background as "filled"
          slot.bg.clear();
          slot.bg.fillStyle(0x5a3a10, 0.9).fillRoundedRect(
            slot.text.x - SYLLABLE_CHIP_W / 2,
            86,
            SYLLABLE_CHIP_W,
            SYLLABLE_CHIP_H,
            10
          );
          slot.bg.lineStyle(2, 0xffd700, 0.8).strokeRoundedRect(
            slot.text.x - SYLLABLE_CHIP_W / 2,
            86,
            SYLLABLE_CHIP_W,
            SYLLABLE_CHIP_H,
            10
          );

          this._updateScore();

          // Resume game after a beat (unless round is complete – celebration handles it)
          this.time.delayedCall(200, () => {
            if (this.syllableGame.currentIndex < this.syllableGame.round?.syllables?.length) {
              this._gameActive = true;
            }
          });
        },
      });
    }
  }

  /**
   * Animate a wrong syllable attempt: shake + red flash.
   */
  _wrongChipAnimation(chip) {
    // Temporarily pause to prevent spam
    this._gameActive = false;

    // Shake the chip
    const origX = chip.container.x;
    this.tweens.add({
      targets: chip.container,
      x: origX + 8,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        chip.container.x = origX;
      },
    });

    // Red flash
    chip.gfx.clear();
    chip.gfx.fillStyle(0xff6b6b, 1);
    chip.gfx.fillRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);
    chip.gfx.lineStyle(3, 0xff0000, 1);
    chip.gfx.strokeRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);

    // Floating "wrong" text
    this._showFloatingText(chip.worldX, chip.worldY - 40, "Not this one! Try the highlighted one 🔊", "#ff8866");

    // Replay audio
    this.time.delayedCall(500, () => {
      this.syllableGame.speak(true);
    });

    // Restore chip appearance
    this.time.delayedCall(600, () => {
      chip.gfx.clear();
      chip.gfx.fillStyle(0xf5deb3, 1);
      chip.gfx.fillRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);
      chip.gfx.lineStyle(3, 0x8b6914, 1);
      chip.gfx.strokeRoundedRect(-SYLLABLE_CHIP_W / 2, -SYLLABLE_CHIP_H / 2, SYLLABLE_CHIP_W, SYLLABLE_CHIP_H, 12);

      this._gameActive = true;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CELEBRATION / LEVEL COMPLETE
  // ═══════════════════════════════════════════════════════════

  _celebrateSyllable(pts, stars, word) {
    this._gameActive = false;

    const W = this.scale.width;
    const H = this.scale.height;

    // Play the word audio one more time
    this.syllableGame.speak(true);

    this._updateScore();

    // Celebration popup
    const popupContainer = this.add.container(W / 2, H / 2)
      .setScrollFactor(0).setDepth(70).setScale(0.5);

    // Background panel
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x3a2a10, 0.95);
    panelGfx.fillRoundedRect(-200, -120, 400, 240, 20);
    panelGfx.lineStyle(3, 0xffd700, 1);
    panelGfx.strokeRoundedRect(-200, -120, 400, 240, 20);
    popupContainer.add(panelGfx);

    // "Great job!" header
    const headerText = this.add.text(0, -80, "🎉 Great Job! 🎉", {
      fontFamily: FONT, fontSize: "28px", fontStyle: "bold", color: "#ffd700",
      stroke: "#3a2a10", strokeThickness: 4,
    }).setOrigin(0.5);
    popupContainer.add(headerText);

    // Full word display
    const wordText = this.add.text(0, -25, word.toUpperCase(), {
      fontFamily: FONT, fontSize: "44px", fontStyle: "bold", color: "#fff8dc",
      stroke: "#5a3a10", strokeThickness: 5,
    }).setOrigin(0.5);
    popupContainer.add(wordText);

    // Score + stars
    const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);
    const scoreDisplay = this.add.text(0, 35, `+${pts}   ${starStr}`, {
      fontFamily: FONT, fontSize: "22px", fontStyle: "bold", color: "#ffd700",
      stroke: "#3a2a10", strokeThickness: 3,
    }).setOrigin(0.5);
    popupContainer.add(scoreDisplay);

    // Motivational subtitle
    const motivations = [
      "You're a syllable master! 🌟",
      "Amazing word building! 📖",
      "Desert champion! 🏆",
      "Incredible reading! 🎯",
      "Word wizard! ✨",
    ];
    const subText = this.add.text(0, 75, Phaser.Math.RND.pick(motivations), {
      fontFamily: FONT, fontSize: "16px", fontStyle: "bold", color: "#f2cf85",
    }).setOrigin(0.5);
    popupContainer.add(subText);

    // Pop-in animation
    this.tweens.add({
      targets: popupContainer,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });

    // Confetti
    for (let i = 0; i < 35; i++) {
      const confetti = this.add.rectangle(
        Phaser.Math.Between(0, W), -10,
        Phaser.Math.Between(6, 12),
        Phaser.Math.Between(8, 16),
        Phaser.Math.RND.pick([0xffd700, 0xff8c00, 0xff6347, 0x87ceeb, 0x98fb98, 0xdda0dd])
      ).setScrollFactor(0).setDepth(69);

      this.tweens.add({
        targets: confetti,
        y: H + 30,
        x: confetti.x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(180, 720),
        duration: Phaser.Math.Between(1200, 2500),
        ease: "Quad.easeIn",
        onComplete: () => confetti.destroy(),
      });
    }

    // Proceed after delay
    this.time.delayedCall(2800, () => {
      popupContainer.destroy();
      this._clearSyllableChips();
      this._clearWordSlots();
      this.syllableGame.afterCelebration();
    });
  }

  _showLevelComplete(accuracy, nextLevel) {
    const W = this.scale.width;
    const H = this.scale.height;

    const popupContainer = this.add.container(W / 2, H / 2)
      .setScrollFactor(0).setDepth(75).setScale(0.5);

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x2a1a05, 0.95);
    panelGfx.fillRoundedRect(-220, -130, 440, 260, 22);
    panelGfx.lineStyle(3, 0xffd700, 1);
    panelGfx.strokeRoundedRect(-220, -130, 440, 260, 22);
    popupContainer.add(panelGfx);

    const title = this.add.text(0, -95, "🏜️ Desert Complete! 🏜️", {
      fontFamily: FONT, fontSize: "26px", fontStyle: "bold", color: "#ffd700",
      stroke: "#2a1a05", strokeThickness: 4,
    }).setOrigin(0.5);
    popupContainer.add(title);

    const accPct = Math.round(accuracy * 100);
    const accText = this.add.text(0, -40, `Accuracy: ${accPct}%`, {
      fontFamily: FONT, fontSize: "22px", fontStyle: "bold",
      color: accPct >= 80 ? "#98fb98" : accPct >= 50 ? "#ffd700" : "#ff8c66",
    }).setOrigin(0.5);
    popupContainer.add(accText);

    const scoreText = this.add.text(0, 0, `Total Score: ⭐ ${this.carry.score + this.syllableGame.getScore()}`, {
      fontFamily: FONT, fontSize: "20px", fontStyle: "bold", color: "#fff8dc",
    }).setOrigin(0.5);
    popupContainer.add(scoreText);

    const nextText = this.add.text(0, 45, `Next: Level ${nextLevel}`, {
      fontFamily: FONT, fontSize: "18px", fontStyle: "bold", color: "#f2cf85",
    }).setOrigin(0.5);
    popupContainer.add(nextText);

    // Play Again button
    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0xffd700, 1);
    btnGfx.fillRoundedRect(-70, 70, 140, 40, 10);
    popupContainer.add(btnGfx);

    const btnText = this.add.text(0, 90, "Play Again!", {
      fontFamily: FONT, fontSize: "18px", fontStyle: "bold", color: "#3a2a10",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    popupContainer.add(btnText);

    btnText.on("pointerdown", () => {
      popupContainer.destroy();
      this.syllableGame.start(nextLevel);
    });

    // Pop-in
    this.tweens.add({
      targets: popupContainer,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });
  }

  // ═══════════════════════════════════════════════════════════
  // VISUAL HELPERS
  // ═══════════════════════════════════════════════════════════

  _spawnSparkles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const sparkle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color)
        .setDepth(25).setAlpha(0.9);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(30, 80);

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 700,
        ease: "Quad.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  _showFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, {
      fontFamily: FONT, fontSize: "15px", fontStyle: "bold",
      color, stroke: "#3a2a10", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 30,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UPDATE LOOP
  // ═══════════════════════════════════════════════════════════

  update(time, delta) {
    if (!this.player) return;
    const dt = Math.min(delta, 50) / 1000;

    const WALK = 160, RUN_MULT = 1.5, JUMP_VEL = -700;
    const body = this.player.body;
    const onGround = body.blocked.down;
    const shift = this._keyShift.isDown;

    // Move
    const speed = WALK * (shift ? RUN_MULT : 1);
    let vx = 0;
    if (this.cursors.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown) vx =  speed;
    body.setVelocityX(vx);
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Jump
    if (this.cursors.up.isDown && onGround) {
      body.setVelocityY(JUMP_VEL);
    }

    // Animation
    let anim = "boy-idle";
    if (!onGround) anim = "boy-jump";
    else if (Math.abs(vx) > 1) anim = shift ? "boy-run" : "boy-walk";
    if (this.player.anims.currentAnim?.key !== anim) this.player.play(anim, true);

    // Check syllable collisions
    this._checkSyllableCollisions();
  }
}