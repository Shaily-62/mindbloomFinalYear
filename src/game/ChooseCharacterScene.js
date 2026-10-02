import Phaser from "phaser";

export default class ChooseCharacterScene extends Phaser.Scene {

  constructor() {
    super("ChooseCharacterScene");
    this.selectedGender = null;
  }

  init(data) {
    // Read gender from URL params
    const params = new URLSearchParams(window.location.search);
    this.selectedGender = params.get("gender") || "boy";
  }

  preload() {

    // Same lobby background layers
    this.load.image("lobby-layer1", "/game-assests/lobby/1.png");
    this.load.image("lobby-layer2", "/game-assests/lobby/2.png");
    this.load.image("lobby-layer3", "/game-assests/lobby/3.png");
    this.load.image("lobby-layer4", "/game-assests/lobby/4.png");
    this.load.image("lobby-layer5", "/game-assests/lobby/5.png");

    // Load character sprites based on selection (both are 128x128)
    if (this.selectedGender === "girl") {
      this.load.spritesheet("char-idle", "/game-assests/character/girl/Idle.png", {
        frameWidth: 128,
        frameHeight: 128
      });
      this.load.spritesheet("char-walk", "/game-assests/character/girl/Walk.png", {
        frameWidth: 128,
        frameHeight: 128
      });
    } else {
      this.load.spritesheet("char-idle", "/game-assests/character/boy/Idle.png", {
        frameWidth: 128,
        frameHeight: 128
      });
      this.load.spritesheet("char-walk", "/game-assests/character/boy/Walk.png", {
        frameWidth: 128,
        frameHeight: 128
      });
    }
  }

  create() {

    const { width, height } = this.scale;
    const CURSIVE_FONT = "'Cedarville Cursive', cursive";
    const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";

    // -------------------------
    // BACKGROUND  (5 = sky at back, 1 = foreground on top)
    // -------------------------

    this.add.image(width / 2, height / 2, "lobby-layer5")
      .setDisplaySize(width, height).setDepth(0);

    this.add.image(width / 2, height / 2, "lobby-layer4")
      .setDisplaySize(width, height).setDepth(1);

    this.add.image(width / 2, height / 2, "lobby-layer3")
      .setDisplaySize(width, height).setDepth(2);

    this.add.image(width / 2, height / 2, "lobby-layer2")
      .setDisplaySize(width, height).setDepth(3);

    this.add.image(width / 2, height / 2, "lobby-layer1")
      .setDisplaySize(width, height).setDepth(5);


    // -------------------------
    // TITLE
    // -------------------------

    this.add.text(width / 2, height * 0.10, "Your Character", {
      fontFamily: CURSIVE_FONT,
      fontSize: "42px",
      color: "#ffffff",
      stroke: "#1b290f",
      strokeThickness: 4,
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(10);

    // -------------------------
    // CHARACTER SPRITE — idle animation on ground
    // -------------------------

    const groundY = height * 0.88;

    // Ground shadow
    this.add.ellipse(width / 2, groundY - 10, 220, 42, 0x000000, 0.38)
      .setDepth(3.8);

    // Create idle animation
    this.anims.create({
      key: "idle-anim",
      frames: this.anims.generateFrameNumbers("char-idle", { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    const charSprite = this.add.sprite(width / 2, groundY, "char-idle")
      .setDisplaySize(500, 500)
      .setOrigin(0.5, 1.0)
      .setDepth(4);

    charSprite.play("idle-anim");

    // -------------------------
    // GENDER LABEL
    // -------------------------

    const genderText = this.selectedGender === "girl" ? "Girl" : "Boy";
    this.add.text(width / 2, height * 0.90, genderText, {
      fontFamily: CURSIVE_FONT,
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#1b290f",
      strokeThickness: 3,
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(10);


    // -------------------------
    // BACK BUTTON
    // -------------------------

    const backBtn = this.add.text(30, 30, "← Back", {
      fontFamily: FONT,
      fontSize: "18px",
      fontWeight: "700",
      color: "#ffffff",
      stroke: "#1b290f",
      strokeThickness: 3
    })
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      window.location.href = "/lobby";
    });


    // -------------------------
    // FULLSCREEN TOGGLE
    // -------------------------

    const fullscreenBtn = this.add.text(
      20,
      height - 20,
      "⛶ Maximize",
      {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff"
      }
    )
      .setOrigin(0, 1)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    fullscreenBtn.on("pointerdown", () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    this.scale.on("enterfullscreen", () => {
      fullscreenBtn.setText("🗗 Minimize");
    });

    this.scale.on("leavefullscreen", () => {
      fullscreenBtn.setText("⛶ Maximize");
    });
  }
}

