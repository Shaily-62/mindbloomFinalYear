import Phaser from "phaser";

export default class LobbyScene extends Phaser.Scene {

  constructor() {
    super("LobbyScene");
    this.selectedGender = "boy";
    this.coins = 1250;
  }

  preload() {

    // Background layers
    this.load.image("lobby-layer1", "/game-assests/lobby/1.png");
    this.load.image("lobby-layer2", "/game-assests/lobby/2.png");
    this.load.image("lobby-layer3", "/game-assests/lobby/3.png");
    this.load.image("lobby-layer4", "/game-assests/lobby/4.png");
    this.load.image("lobby-layer5", "/game-assests/lobby/5.png");

    // Left menu icons
    this.load.image("icon-character", "/game-assests/lobby/charcter.png");
    this.load.image("icon-moves", "/game-assests/lobby/moves.png");
    this.load.image("icon-rewards", "/game-assests/lobby/rewards.png");

    // HUD icons
    this.load.image("icon-start", "/game-assests/lobby/start.png");
    this.load.image("icon-coins", "/game-assests/lobby/coins.png");
    this.load.image("icon-name",  "/game-assests/lobby/name.png");

    // Dialogue & Moves Box graphics
    this.load.image("dialogue-box", "/game-assests/lobby/dailoguebox.png");
    this.load.image("moves-box", "/game-assests/lobby/movesbox.png");

    // Character Idle Spritesheets (768x128 -> 6 frames of 128x128)
    this.load.spritesheet("boy-idle", "/game-assests/character/boy/Idle.png", {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet("girl-idle", "/game-assests/character/girl/Idle.png", {
      frameWidth: 128,
      frameHeight: 128
    });

    // Boy Attack Spritesheets
    this.load.spritesheet("boy-attack1", "/game-assests/character/boy/Attack_1.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("boy-attack2", "/game-assests/character/boy/Attack_2.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("boy-attack3", "/game-assests/character/boy/Attack_3.png", { frameWidth: 128, frameHeight: 128 });

    // Girl Attack Spritesheets
    this.load.spritesheet("girl-attack1", "/game-assests/character/girl/Attack_1.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("girl-attack2", "/game-assests/character/girl/Attack_2.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("girl-attack3", "/game-assests/character/girl/Attack_3.png", { frameWidth: 128, frameHeight: 128 });
  }

  create() {

    const { width, height } = this.scale;

    // Fonts
    const CURSIVE_FONT = "'Cedarville Cursive', cursive";
    const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";

    this.CURSIVE_FONT = CURSIVE_FONT;
    this.FONT = FONT;
    this.W = width;
    this.H = height;

    // -------------------------
    // FULLSCREEN TOGGLE BUTTON
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

    // -------------------------
    // BACKGROUND LAYERS
    // -------------------------

    this.add.image(width / 2, height / 2, "lobby-layer5").setDisplaySize(width, height).setDepth(0);
    this.add.image(width / 2, height / 2, "lobby-layer4").setDisplaySize(width, height).setDepth(1);
    this.add.image(width / 2, height / 2, "lobby-layer3").setDisplaySize(width, height).setDepth(2);
    this.add.image(width / 2, height / 2, "lobby-layer2").setDisplaySize(width, height).setDepth(3);
    this.add.image(width / 2, height / 2, "lobby-layer1").setDisplaySize(width, height).setDepth(5);


    // -------------------------
    // PLAYER NAME BADGE
    // -------------------------

    this.add.image(width - 20, 20, "icon-name")
      .setDisplaySize(160, 50)
      .setOrigin(1, 0)
      .setDepth(10);

    this.add.text(width - 100, 35, "Player1", {
      fontFamily: FONT,
      fontSize: "16px",
      color: "#f5fbef",
      stroke: "#503d42",
      strokeThickness: 2
    })
      .setOrigin(0.5, 0.5)
      .setDepth(11);


    // -------------------------
    // COINS BADGE
    // -------------------------

    this.add.image(20, 20, "icon-coins")
      .setDisplaySize(45, 45)
      .setOrigin(0, 0)
      .setDepth(10);

    this.coinsText = this.add.text(72, 28, `${this.coins.toLocaleString()}`, {
      fontFamily: FONT,
      fontSize: "20px",
      color: "#f5fbef",
      stroke: "#503d42",
      strokeThickness: 3
    })
      .setOrigin(0, 0)
      .setDepth(10);


    // -------------------------
    // LEFT MENU  (Character, Moves, Daily Rewards icons)
    // -------------------------

    // 1. Character Icon
    const charIcon = this.add.image(70, 120, "icon-character")
      .setDisplaySize(70, 70)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.add.text(70, 160, "Character", {
      fontFamily: FONT,
      fontSize: "13px",
      color: "#ffffff"
    })
      .setOrigin(0.5, 0)
      .setDepth(10);

    charIcon.on("pointerdown", () => {
      this.showCharacterDialog();
    });

    // 2. Moves Icon
    const movesIcon = this.add.image(70, 220, "icon-moves")
      .setDisplaySize(70, 70)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.add.text(70, 260, "Moves", {
      fontFamily: FONT,
      fontSize: "13px",
      color: "#ffffff"
    })
      .setOrigin(0.5, 0)
      .setDepth(10);

    movesIcon.on("pointerdown", () => {
      this.showMovesDialog();
    });

    // 3. Daily Rewards Icon
    const rewardsIcon = this.add.image(70, 320, "icon-rewards")
      .setDisplaySize(70, 70)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.add.text(70, 360, "Daily Rewards", {
      fontFamily: FONT,
      fontSize: "13px",
      color: "#ffffff"
    })
      .setOrigin(0.5, 0)
      .setDepth(10);

    rewardsIcon.on("pointerdown", () => {
      this.showRewardsDialog();
    });


    // -------------------------
    // START BUTTON
    // -------------------------

    const startButton = this.add.image(width - 20, height - 20, "icon-start")
      .setDisplaySize(180, 70)
      .setOrigin(1, 1)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      console.log("Starting game...");
    });


    // -------------------------
    // CREATE ANIMATIONS
    // -------------------------

    // Boy Animations
    if (!this.anims.exists("boy-idle-anim")) {
      this.anims.create({ key: "boy-idle-anim", frames: this.anims.generateFrameNumbers("boy-idle", { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
    }
    if (!this.anims.exists("boy-attack1-anim")) {
      this.anims.create({ key: "boy-attack1-anim", frames: this.anims.generateFrameNumbers("boy-attack1", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    }
    if (!this.anims.exists("boy-attack2-anim")) {
      this.anims.create({ key: "boy-attack2-anim", frames: this.anims.generateFrameNumbers("boy-attack2", { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    }
    if (!this.anims.exists("boy-attack3-anim")) {
      this.anims.create({ key: "boy-attack3-anim", frames: this.anims.generateFrameNumbers("boy-attack3", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    }

    // Girl Animations
    if (!this.anims.exists("girl-idle-anim")) {
      this.anims.create({ key: "girl-idle-anim", frames: this.anims.generateFrameNumbers("girl-idle", { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
    }
    if (!this.anims.exists("girl-attack1-anim")) {
      this.anims.create({ key: "girl-attack1-anim", frames: this.anims.generateFrameNumbers("girl-attack1", { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    }
    if (!this.anims.exists("girl-attack2-anim")) {
      this.anims.create({ key: "girl-attack2-anim", frames: this.anims.generateFrameNumbers("girl-attack2", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    }
    if (!this.anims.exists("girl-attack3-anim")) {
      this.anims.create({ key: "girl-attack3-anim", frames: this.anims.generateFrameNumbers("girl-attack3", { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    }


    // -------------------------
    // AUTO-SHOW CHARACTER DIALOG ON LOAD
    // -------------------------

    this.showCharacterDialog();
  }


  // =========================================================
  // CHARACTER SELECTION DIALOG (side-by-side on right)
  // =========================================================

  showCharacterDialog() {

    if (this.dialogGroup) return;

    const { W: width, H: height, CURSIVE_FONT } = this;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3)
      .setDepth(20)
      .setInteractive();

    const boxX = width * 0.70;
    const boxY = height / 2;

    const box = this.add.image(boxX, boxY, "dialogue-box")
      .setDisplaySize(530, 330)
      .setDepth(21);

    const title = this.add.text(boxX, boxY - 110, "Choose Your Character", {
      fontFamily: CURSIVE_FONT,
      fontSize: "32px",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(22);

    const boxSize = 130;

    // Boy option
    const boyBoxX = boxX - 105;
    const boyBoxY = boxY + 20;

    const boySprite = this.add.sprite(boyBoxX, boyBoxY - 20, "boy-idle", 0)
      .setDisplaySize(110, 110)
      .setDepth(23);
    boySprite.play("boy-idle-anim");

    const boyLabel = this.add.text(boyBoxX, boyBoxY + 45, "Boy", {
      fontFamily: CURSIVE_FONT,
      fontSize: "26px",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(23);

    const boyHitArea = this.add.rectangle(boyBoxX, boyBoxY, boxSize, boxSize, 0x000000, 0)
      .setDepth(24)
      .setInteractive({ useHandCursor: true });

    boyHitArea.on("pointerover", () => boySprite.setDisplaySize(120, 120));
    boyHitArea.on("pointerout", () => boySprite.setDisplaySize(110, 110));

    // Girl option
    const girlBoxX = boxX + 105;
    const girlBoxY = boxY + 20;

    const girlSprite = this.add.sprite(girlBoxX, girlBoxY - 20, "girl-idle", 0)
      .setDisplaySize(110, 110)
      .setDepth(23);
    girlSprite.play("girl-idle-anim");

    const girlLabel = this.add.text(girlBoxX, girlBoxY + 45, "Girl", {
      fontFamily: CURSIVE_FONT,
      fontSize: "26px",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(23);

    const girlHitArea = this.add.rectangle(girlBoxX, girlBoxY, boxSize, boxSize, 0x000000, 0)
      .setDepth(24)
      .setInteractive({ useHandCursor: true });

    girlHitArea.on("pointerover", () => girlSprite.setDisplaySize(120, 120));
    girlHitArea.on("pointerout", () => girlSprite.setDisplaySize(110, 110));

    this.dialogGroup = [
      overlay, box, title,
      boySprite, boyLabel, boyHitArea,
      girlSprite, girlLabel, girlHitArea
    ];

    boyHitArea.on("pointerdown", () => {
      this.destroyDialog();
      this.showSelectedCharacter("boy");
    });

    girlHitArea.on("pointerdown", () => {
      this.destroyDialog();
      this.showSelectedCharacter("girl");
    });

    // Ensure character is displayed side-by-side on left
    if (!this.selectedCharSprite) {
      this.showSelectedCharacter(this.selectedGender || "boy");
    }
  }


  // =========================================================
  // MOVES SECTION DIALOG (side-by-side on right)
  // =========================================================

  showMovesDialog() {

    if (this.dialogGroup) return;

    const { W: width, H: height, CURSIVE_FONT, FONT } = this;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3)
      .setDepth(20)
      .setInteractive();

    const boxX = width * 0.70;
    const boxY = height / 2;

    // Moves Box container image (using movesbox.png)
    const box = this.add.image(boxX, boxY, "moves-box")
      .setDisplaySize(500, 340)
      .setDepth(21);

    // Title: Character Moves
    const title = this.add.text(boxX, boxY - 110, "Character Moves", {
      fontFamily: CURSIVE_FONT,
      fontSize: "34px",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(22);

    const subtitle = this.add.text(boxX, boxY - 70, "Select an Attack Move to trigger:", {
      fontFamily: FONT,
      fontSize: "13px",
      fontWeight: "700",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(22);

    // --- Attack 1, Attack 2, Attack 3 Buttons ---
    const attackButtons = [];
    const attacks = [
      { id: 1, label: "⚔️ Attack 1" },
      { id: 2, label: "⚡ Attack 2" },
      { id: 3, label: "🔥 Attack 3" }
    ];

    attacks.forEach((atk, idx) => {
      const btnX = boxX - 120 + idx * 120;
      const btnY = boxY - 20;

      const btnBg = this.add.graphics().setDepth(22);
      const drawBtn = (isHover) => {
        btnBg.clear();
        btnBg.fillStyle(isHover ? 0x8b5cf6 : 0x6d28d9, 0.9);
        btnBg.fillRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
        btnBg.lineStyle(2, 0xffffff, 0.9);
        btnBg.strokeRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
      };
      drawBtn(false);

      const btnText = this.add.text(btnX, btnY, atk.label, {
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: "700",
        color: "#ffffff"
      })
        .setOrigin(0.5)
        .setDepth(23);

      const hitArea = this.add.rectangle(btnX, btnY, 104, 36, 0x000000, 0)
        .setDepth(24)
        .setInteractive({ useHandCursor: true });

      hitArea.on("pointerover", () => drawBtn(true));
      hitArea.on("pointerout", () => drawBtn(false));
      hitArea.on("pointerdown", () => {
        this.triggerAttack(atk.id);
      });

      attackButtons.push(btnBg, btnText, hitArea);
    });

    // Control tips below buttons
    const tipsText = this.add.text(boxX, boxY + 40, "🏃 Walk / Run: Arrow Keys / WASD\n🛡️ Shield: Shift Key  |  ✨ Special: E", {
      fontFamily: FONT,
      fontSize: "12px",
      color: "#3a2a2e",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(22);

    // Close button
    const closeBtn = this.add.text(boxX, boxY + 110, "✕ Close", {
      fontFamily: CURSIVE_FONT,
      fontSize: "24px",
      color: "#503d42"
    })
      .setOrigin(0.5)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      this.destroyDialog();
    });

    closeBtn.on("pointerover", () => closeBtn.setColor("#8b0000"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#503d42"));

    this.dialogGroup = [overlay, box, title, subtitle, ...attackButtons, tipsText, closeBtn];

    // Ensure character is displayed side-by-side on left
    if (!this.selectedCharSprite) {
      this.showSelectedCharacter(this.selectedGender || "boy");
    }
  }


  // =========================================================
  // TRIGGER ATTACK ANIMATION ON CHARACTER
  // =========================================================

  triggerAttack(attackNum) {
    if (!this.selectedCharSprite) return;

    const gender = this.selectedGender || "boy";
    const animKey = `${gender}-attack${attackNum}-anim`;
    const idleAnimKey = `${gender}-idle-anim`;

    // Stop current animation and play attack
    this.selectedCharSprite.stop();
    this.selectedCharSprite.play(animKey);

    // Upon completion, return to idle
    this.selectedCharSprite.once("animationcomplete", () => {
      this.selectedCharSprite.play(idleAnimKey);
    });
  }


  // =========================================================
  // DAILY REWARDS DIALOG (side-by-side on right)
  // =========================================================

  showRewardsDialog() {

    if (this.dialogGroup) return;

    const { W: width, H: height, CURSIVE_FONT, FONT } = this;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3)
      .setDepth(20)
      .setInteractive();

    const boxX = width * 0.70;
    const boxY = height / 2;

    const box = this.add.image(boxX, boxY, "dialogue-box")
      .setDisplaySize(530, 340)
      .setDepth(21);

    const title = this.add.text(boxX, boxY - 110, "Daily Rewards", {
      fontFamily: CURSIVE_FONT,
      fontSize: "34px",
      color: "#503d42",
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(22);

    // 7-Day Rewards streak grid
    const days = [
      { day: "Day 1", reward: "🪙 100", status: "Claimed ✓" },
      { day: "Day 2", reward: "🪙 250", status: "READY!" },
      { day: "Day 3", reward: "🛡️ Shield", status: "Locked" },
      { day: "Day 4", reward: "🪙 500", status: "Locked" },
      { day: "Day 5", reward: "⚔️ Weapon", status: "Locked" },
      { day: "Day 6", reward: "🪙 1000", status: "Locked" },
      { day: "Day 7", reward: "👑 Crown", status: "Locked" },
    ];

    const rewardsGroup = [];
    days.forEach((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const cardX = boxX - 165 + col * 110;
      const cardY = boxY - 35 + row * 60;

      const cardBg = this.add.graphics().setDepth(22);
      cardBg.fillStyle(item.status === "READY!" ? 0xfef08a : 0xffffff, 0.9);
      cardBg.fillRoundedRect(cardX - 46, cardY - 22, 92, 50, 8);
      cardBg.lineStyle(1.5, item.status === "READY!" ? 0xca8a04 : 0x94a3b8, 0.8);
      cardBg.strokeRoundedRect(cardX - 46, cardY - 22, 92, 50, 8);

      const dayText = this.add.text(cardX, cardY - 12, item.day, {
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: "700",
        color: "#503d42"
      }).setOrigin(0.5).setDepth(23);

      const rewardText = this.add.text(cardX, cardY + 5, item.reward, {
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: "700",
        color: "#166534"
      }).setOrigin(0.5).setDepth(23);

      rewardsGroup.push(cardBg, dayText, rewardText);
    });

    // Claim Button
    const claimBtnBg = this.add.graphics().setDepth(22);
    claimBtnBg.fillStyle(0x15803d, 0.95);
    claimBtnBg.fillRoundedRect(boxX - 85, boxY + 75, 170, 38, 10);
    claimBtnBg.lineStyle(2, 0x86efac, 0.9);
    claimBtnBg.strokeRoundedRect(boxX - 85, boxY + 75, 170, 38, 10);

    const claimText = this.add.text(boxX, boxY + 94, "Claim 250 Coins! 🎉", {
      fontFamily: FONT,
      fontSize: "14px",
      fontWeight: "700",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(23);

    const claimHit = this.add.rectangle(boxX, boxY + 94, 170, 38, 0x000000, 0)
      .setDepth(24)
      .setInteractive({ useHandCursor: true });

    claimHit.on("pointerdown", () => {
      this.coins += 250;
      if (this.coinsText) {
        this.coinsText.setText(this.coins.toLocaleString());
      }
      claimText.setText("Claimed! ✓");
      claimHit.disableInteractive();
    });

    // Close button
    const closeBtn = this.add.text(boxX + 210, boxY - 130, "✕", {
      fontFamily: FONT,
      fontSize: "20px",
      fontWeight: "700",
      color: "#503d42"
    })
      .setOrigin(0.5)
      .setDepth(23)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      this.destroyDialog();
    });

    this.dialogGroup = [overlay, box, title, ...rewardsGroup, claimBtnBg, claimText, claimHit, closeBtn];

    // Ensure character is displayed side-by-side on left
    if (!this.selectedCharSprite) {
      this.showSelectedCharacter(this.selectedGender || "boy");
    }
  }


  destroyDialog() {
    if (this.dialogGroup) {
      this.dialogGroup.forEach(obj => obj.destroy());
      this.dialogGroup = null;
    }
  }


  // =========================================================
  // SHOW SELECTED CHARACTER — POSITIONED ON LEFT SIDE (side-by-side)
  // =========================================================

  showSelectedCharacter(gender) {

    this.selectedGender = gender;

    if (this.selectedCharGroup) {
      this.selectedCharGroup.forEach(obj => obj.destroy());
      this.selectedCharGroup = null;
    }

    const { W: width, H: height } = this;

    const spriteKey = gender === "girl" ? "girl-idle" : "boy-idle";
    const animKey = gender === "girl" ? "girl-idle-anim" : "boy-idle-anim";

    const groundY = height * 0.88;

    // Character position on left-center of ground for side-by-side view with modals
    const charX = width * 0.32;

    const shadow = this.add.ellipse(charX, groundY - 10, 220, 42, 0x000000, 0.38)
      .setDepth(3.8);

    const charSprite = this.add.sprite(charX, groundY, spriteKey, 0)
      .setDisplaySize(500, 500)
      .setOrigin(0.5, 1.0)
      .setDepth(4);

    charSprite.play(animKey);

    this.selectedCharGroup = [shadow, charSprite];
    this.selectedCharSprite = charSprite;
  }
}