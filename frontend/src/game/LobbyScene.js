import Phaser from "phaser";

export default class LobbyScene extends Phaser.Scene {

  constructor() {
    super("LobbyScene");
    this.selectedGender = "boy";
    this.coins = 1250;
  }
  init(data) {
  this.childId   = data?.child?.id ?? "guest";
  this.childName = data?.child?.name || "Player";
  const saved    = data?.saved || {};
  this.selectedGender    = saved.character || "boy";
  this.hasSavedCharacter = !!saved.character;
  this.movesCount        = saved.moves ?? 0;
  this.daysClaimed       = Math.min(saved.days ?? 0, 7);
  this.saveLobby         = data?.saveLobby || (async () => {});
  this.dialogGroup = null;
  this.selectedCharSprite = null;
  this.selectedCharGroup = null;

  // Read unlocked moves & perks from localStorage
  try {
    const raw = localStorage.getItem(`mb_unlocked_${this.childId}`);
    const unlocked = raw ? JSON.parse(raw) : { moves: [], perks: [] };
    this.unlockedMoves = unlocked.moves || [];
    this.unlockedPerks = unlocked.perks || [];
  } catch (e) {
    this.unlockedMoves = [];
    this.unlockedPerks = [];
  }
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

    const displayName = this.childName.length > 12
  ? this.childName.slice(0, 11) + "…"
  : this.childName;

this.add.text(width - 100, 28, displayName, {
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
       window.location.href = "/map";
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

    boyHitArea.on("pointerdown", () => { this.destroyDialog(); this.chooseCharacter("boy"); });


    girlHitArea.on("pointerdown", () => { this.destroyDialog(); this.chooseCharacter("girl"); });

    

    // Ensure character is displayed side-by-side on left
    if (!this.selectedCharSprite) {
      this.showSelectedCharacter(this.selectedGender || "boy");
    }
  }

  chooseCharacter(gender) {
  this.showSelectedCharacter(gender);
  this.saveLobby({ character: gender });
  // Persist so SwampScene / DesertScene can read it
  localStorage.setItem("selectedCharacter", gender);
}
  // =========================================================
  // MOVES SECTION DIALOG (side-by-side on right)
  // =========================================================

  showMovesDialog() {
    if (this.dialogGroup) return;
    const { W: width, H: height, CURSIVE_FONT, FONT } = this;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3)
      .setDepth(20).setInteractive();
    const boxX = width * 0.70, boxY = height / 2;
    const box = this.add.image(boxX, boxY, "moves-box")
      .setDisplaySize(500, 340).setDepth(21);
    const title = this.add.text(boxX, boxY - 110, "Character Moves", {
      fontFamily: CURSIVE_FONT, fontSize: "34px", color: "#503d42", align: "center",
    }).setOrigin(0.5).setDepth(22);

    const subtitle = this.add.text(boxX, boxY - 70, "Earn moves from Daily Rewards:", {
      fontFamily: FONT, fontSize: "13px", fontWeight: "700", color: "#503d42", align: "center",
    }).setOrigin(0.5).setDepth(22);

    const attacks = [
      { id: 1, label: "⚔️ Attack 1" },
      { id: 2, label: "⚡ Attack 2" },
      { id: 3, label: "🔥 Attack 3" },
    ];

    const attackButtons = [];
    attacks.forEach((atk, idx) => {
      const btnX = boxX - 120 + idx * 120;
      const btnY = boxY - 20;
      const isUnlocked = this.unlockedMoves.includes(atk.id);

      const btnBg = this.add.graphics().setDepth(22);
      const drawBtn = (hover) => {
        btnBg.clear();
        if (!isUnlocked) {
          btnBg.fillStyle(0x555555, 0.5);
          btnBg.fillRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
          btnBg.lineStyle(2, 0x888888, 0.6);
          btnBg.strokeRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
        } else {
          btnBg.fillStyle(hover ? 0x8b5cf6 : 0x6d28d9, 0.9);
          btnBg.fillRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
          btnBg.lineStyle(2, 0xffffff, 0.9);
          btnBg.strokeRoundedRect(btnX - 52, btnY - 18, 104, 36, 10);
        }
      };
      drawBtn(false);

      const displayLabel = isUnlocked ? atk.label : `🔒 Move ${atk.id}`;
      const btnText = this.add.text(btnX, btnY, displayLabel, {
        fontFamily: FONT, fontSize: "13px", fontWeight: "700",
        color: isUnlocked ? "#ffffff" : "#999999",
      }).setOrigin(0.5).setDepth(23);

      const hitArea = this.add.rectangle(btnX, btnY, 104, 36, 0x000000, 0)
        .setDepth(24);
      if (isUnlocked) {
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on("pointerover", () => drawBtn(true));
        hitArea.on("pointerout",  () => drawBtn(false));
        hitArea.on("pointerdown", () => this.triggerAttack(atk.id));
      }

      attackButtons.push(btnBg, btnText, hitArea);
    });

    // Show active perks
    const perkLabels = {
      speed:  "💨 Speed Boost active!",
      jump:   "🦘 Super Jump active!",
      shield: "🛡️ Shield Power active!",
    };
    const activePerkTexts = this.unlockedPerks
      .map(p => perkLabels[p] || "")
      .filter(Boolean)
      .join("  ");

    const tipsText = this.add.text(boxX, boxY + 40,
      activePerkTexts || "🏃 Arrow Keys / WASD to move  |  Space Attack", {
      fontFamily: FONT, fontSize: "12px", color: "#3a2a2e", align: "center",
    }).setOrigin(0.5).setDepth(22);

    const closeBtn = this.add.text(boxX, boxY + 110, "✕ Close", {
      fontFamily: CURSIVE_FONT, fontSize: "24px", color: "#503d42",
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.destroyDialog());
    closeBtn.on("pointerover", () => closeBtn.setColor("#8b0000"));
    closeBtn.on("pointerout",  () => closeBtn.setColor("#503d42"));

    this.dialogGroup = [overlay, box, title, subtitle, ...attackButtons, tipsText, closeBtn];
    if (!this.selectedCharSprite) this.showSelectedCharacter(this.selectedGender || "boy");
  }

  

  // =========================================================
  // TRIGGER ATTACK ANIMATION ON CHARACTER
  // =========================================================

  triggerAttack(attackNum) {
    if (!this.selectedCharSprite) return;
    if (!this.unlockedMoves.includes(attackNum)) return;

    const gender = this.selectedGender || "boy";
    const animKey = `${gender}-attack${attackNum}-anim`;
    const idleAnimKey = `${gender}-idle-anim`;
    this.movesCount++;
    this.saveLobby({ moves: this.movesCount });

    this.selectedCharSprite.stop();
    this.selectedCharSprite.play(animKey);
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
    .setDepth(20).setInteractive();
  const boxX = width * 0.70, boxY = height / 2;
  const box = this.add.image(boxX, boxY, "dialogue-box").setDisplaySize(530, 360).setDepth(21);
  const title = this.add.text(boxX, boxY - 120, "Daily Rewards", {
    fontFamily: CURSIVE_FONT, fontSize: "34px", color: "#503d42", align: "center",
  }).setOrigin(0.5).setDepth(22);

  // 7-day reward definitions: days 1-3 unlock moves, 4-7 unlock perks
  const REWARDS = [
    { day: "Day 1", emoji: "⚔️", label: "Attack 1",     type: "move",    value: 1,        desc: "Move 1 unlocked!" },
    { day: "Day 2", emoji: "⚡", label: "Attack 2",     type: "move",    value: 2,        desc: "Move 2 unlocked!" },
    { day: "Day 3", emoji: "🔥", label: "Attack 3",     type: "move",    value: 3,        desc: "Move 3 unlocked!" },
    { day: "Day 4", emoji: "💨", label: "Speed Boost",  type: "perk",    value: "speed",  desc: "Run 50% faster!" },
    { day: "Day 5", emoji: "🦘", label: "Super Jump",   type: "perk",    value: "jump",   desc: "Jump 50% higher!" },
    { day: "Day 6", emoji: "🛡️", label: "Shield Power", type: "perk",    value: "shield", desc: "Shield unlocked!" },
    { day: "Day 7", emoji: "👑", label: "Champion!",    type: "special", value: "all",    desc: "All power!" },
  ];

  const next = this.daysClaimed;
  const today = new Date().toISOString().slice(0, 10);
  const claimKey = `mb_claim_${this.childId}`;
  const claimedToday = localStorage.getItem(claimKey) === today;
  const allDone = next >= REWARDS.length;
  const canClaim = !allDone && !claimedToday;

  const rewardsGroup = [];
  REWARDS.forEach((item, idx) => {
    const claimed = idx < next;
    const ready   = idx === next && canClaim;
    const cardX   = boxX - 165 + (idx % 4) * 110;
    const cardY   = boxY - 40 + Math.floor(idx / 4) * 68;

    const cardBg = this.add.graphics().setDepth(22);
    cardBg.fillStyle(ready ? 0xfef08a : claimed ? 0xdcfce7 : 0xffffff, 0.9);
    cardBg.fillRoundedRect(cardX - 46, cardY - 28, 92, 58, 8);
    cardBg.lineStyle(1.5, ready ? 0xca8a04 : claimed ? 0x4ade80 : 0x94a3b8, 0.9);
    cardBg.strokeRoundedRect(cardX - 46, cardY - 28, 92, 58, 8);

    const dayLabel = item.day + (claimed ? " ✓" : "");
    const dayText = this.add.text(cardX, cardY - 16, dayLabel, {
      fontFamily: FONT, fontSize: "10px", fontWeight: "700", color: "#503d42",
    }).setOrigin(0.5).setDepth(23);
    const emojiText = this.add.text(cardX, cardY + 0, item.emoji, {
      fontFamily: FONT, fontSize: "18px",
    }).setOrigin(0.5).setDepth(23);
    const moveText = this.add.text(cardX, cardY + 18, item.label, {
      fontFamily: FONT, fontSize: "9px", fontWeight: "700", color: "#166534",
    }).setOrigin(0.5).setDepth(23);
    rewardsGroup.push(cardBg, dayText, emojiText, moveText);
  });

  const cur = REWARDS[Math.min(next, REWARDS.length - 1)];
  const claimLabel = allDone
    ? "All rewards claimed! 🏆"
    : claimedToday
    ? "Come back tomorrow ⏰"
    : `Claim: ${cur.emoji} ${cur.label}!`;

  const claimBtnBg = this.add.graphics().setDepth(22);
  claimBtnBg.fillStyle(canClaim ? 0x15803d : 0x6b7280, 0.95);
  claimBtnBg.fillRoundedRect(boxX - 95, boxY + 90, 190, 38, 10);
  claimBtnBg.lineStyle(2, 0x86efac, 0.9);
  claimBtnBg.strokeRoundedRect(boxX - 95, boxY + 90, 190, 38, 10);

  const claimText = this.add.text(boxX, boxY + 109, claimLabel, {
    fontFamily: FONT, fontSize: "13px", fontWeight: "700", color: "#ffffff",
  }).setOrigin(0.5).setDepth(23);

  const claimHit = this.add.rectangle(boxX, boxY + 109, 190, 38, 0x000000, 0).setDepth(24);
  if (canClaim) {
    claimHit.setInteractive({ useHandCursor: true });
    claimHit.on("pointerdown", () => {
      this.daysClaimed += 1;
      localStorage.setItem(claimKey, today);

      // Apply the reward
      try {
        const rawKey = `mb_unlocked_${this.childId}`;
        const raw = localStorage.getItem(rawKey);
        const unlocked = raw ? JSON.parse(raw) : { moves: [], perks: [] };

        if (cur.type === "move") {
          if (!unlocked.moves.includes(cur.value)) unlocked.moves.push(cur.value);
          this.unlockedMoves = [...unlocked.moves];
        } else if (cur.type === "perk") {
          if (!unlocked.perks.includes(cur.value)) unlocked.perks.push(cur.value);
          this.unlockedPerks = [...unlocked.perks];
        } else if (cur.type === "special") {
          // Day 7: give everything
          unlocked.moves = [1, 2, 3];
          unlocked.perks = ["speed", "jump", "shield"];
          this.unlockedMoves = [1, 2, 3];
          this.unlockedPerks = ["speed", "jump", "shield"];
        }
        localStorage.setItem(rawKey, JSON.stringify(unlocked));
      } catch (e) {
        console.error("unlock save error:", e);
      }

      this.saveLobby({ days: this.daysClaimed });
      this.destroyDialog();
      this.showRewardsDialog();
    });
  }

  const closeBtn = this.add.text(boxX + 210, boxY - 145, "✕", {
    fontFamily: FONT, fontSize: "20px", fontWeight: "700", color: "#503d42",
  }).setOrigin(0.5).setDepth(23).setInteractive({ useHandCursor: true });
  closeBtn.on("pointerdown", () => this.destroyDialog());

  this.dialogGroup = [overlay, box, title, ...rewardsGroup, claimBtnBg, claimText, claimHit, closeBtn];
  if (!this.selectedCharSprite) this.showSelectedCharacter(this.selectedGender || "boy");
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