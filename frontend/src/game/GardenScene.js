import Phaser from "phaser";

const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";

// ── Asset paths ──────────────────────────────────────────────
const GARDEN_BG = "/game-assests/garden/bg/Summer1.png";
const FRUIT_BASE = "/game-assests/garden/fruits";
const TOTAL_FRUIT_IMAGES = 48; // 1.png – 48.png

// ── Level Grid Configurations ────────────────────────────────
// Level 1 starts with a small, accessible 2x2 grid (2 pairs)
const LEVEL_CONFIGS = {
  1: { cols: 2, rows: 2, cardW: 160, cardH: 190, gap: 30, radius: 18, previewSec: 5 }, // 4 cards (2 pairs)
  2: { cols: 3, rows: 2, cardW: 145, cardH: 175, gap: 24, radius: 16, previewSec: 5 }, // 6 cards (3 pairs)
  3: { cols: 4, rows: 2, cardW: 135, cardH: 160, gap: 20, radius: 14, previewSec: 5 }, // 8 cards (4 pairs)
  4: { cols: 4, rows: 3, cardW: 120, cardH: 140, gap: 18, radius: 14, previewSec: 5 }, // 12 cards (6 pairs)
  5: { cols: 4, rows: 4, cardW: 110, cardH: 125, gap: 14, radius: 12, previewSec: 5 }, // 16 cards (8 pairs)
};

// ── Animation Tuning ─────────────────────────────────────────
const FLIP_DURATION = 160; // snappy, responsive card flip

// ── Colours ──────────────────────────────────────────────────
const COL_CARD_BACK = 0x225e16;
const COL_CARD_BACK_BORDER = 0x55cc3b;
const COL_CARD_FACE = 0xfcf9f2;
const COL_CARD_FACE_BORDER = 0xcbb87a;
const COL_OVERLAY = 0x071504;
const COL_GOLD = "#ffd700";
const COL_GREEN = "#7ddf64";
const COL_WHITE = "#ffffff";
const COL_RED = "#ff6b6b";

export default class GardenScene extends Phaser.Scene {
  constructor() {
    super("GardenScene");
  }

  // ── init ────────────────────────────────────────────────────
  init(data) {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const urlScore = params ? parseInt(params.get("score") || "0", 10) : 0;
    const urlLevel = params ? parseInt(params.get("level") || "1", 10) : 1;

    this._clicks = 0;
    this._hits = 0;
    this._misses = 0;
    this._score = data?.score ?? urlScore ?? 0;
    this._level = data?.level ?? urlLevel ?? 1;
    this._matchedPairs = 0;
    this._flippedCards = []; // active open cards
    this._cards = [];
    this._roundStartTime = 0;
    this._isPreviewing = true;
    this._gameOver = false;
    this._mismatchTimer = null;
    this._previewTimer = null;
    this._previewCountdownEvent = null;
  }

  // ── preload ─────────────────────────────────────────────────
  preload() {
    this.load.image("garden-bg", GARDEN_BG);
    for (let i = 1; i <= TOTAL_FRUIT_IMAGES; i++) {
      const key = `fruit-${i}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, `${FRUIT_BASE}/${i}.png`);
      }
    }
  }

  // ── create ──────────────────────────────────────────────────
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // — Background —
    const bg = this.add.image(W / 2, H / 2, "garden-bg");
    bg.setDisplaySize(W, H).setDepth(0);

    // — Dim overlay so cards pop —
    this.add.graphics().setDepth(1)
      .fillStyle(COL_OVERLAY, 0.52)
      .fillRect(0, 0, W, H);

    // — Title —
    this.add.text(W / 2, 28, "🌿 Garden Memory 🌿", {
      fontFamily: FONT,
      fontSize: "32px",
      fontStyle: "bold",
      color: COL_WHITE,
      stroke: "#14280c",
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(50);

    // — HUD bar —
    this._hudBg = this.add.graphics().setDepth(49).setScrollFactor(0);
    this._hudBg.fillStyle(0x0e1a08, 0.85);
    this._hudBg.fillRoundedRect(W / 2 - 340, 68, 680, 46, 14);
    this._hudBg.lineStyle(2, 0x4baf30, 0.7);
    this._hudBg.strokeRoundedRect(W / 2 - 340, 68, 680, 46, 14);

    this._levelText = this.add.text(W / 2 - 300, 80, `Level ${this._level}`, {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold", color: COL_GOLD,
    }).setDepth(52);

    this._scoreText = this.add.text(W / 2 - 140, 80, `⭐ ${this._score}`, {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold", color: COL_WHITE,
    }).setDepth(52);

    this._pairsText = this.add.text(W / 2 + 60, 80, `Pairs: 0 / 2`, {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold", color: COL_GREEN,
    }).setDepth(52);

    this._timerText = this.add.text(W / 2 + 230, 80, "⏱ 0:00", {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold", color: COL_WHITE,
    }).setDepth(52);

    // Build the first round
    this._buildRound();
  }

  // ── Build a round with appropriate grid for current level ───
  _buildRound() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Clear old cards & timers
    if (this._mismatchTimer) {
      this._mismatchTimer.remove();
      this._mismatchTimer = null;
    }
    if (this._previewTimer) {
      this._previewTimer.remove();
      this._previewTimer = null;
    }
    if (this._previewCountdownEvent) {
      this._previewCountdownEvent.remove();
      this._previewCountdownEvent = null;
    }

    this._cards.forEach(c => c.container?.destroy());
    this._cards = [];
    this._flippedCards = [];
    this._matchedPairs = 0;
    this._isPreviewing = true;
    this._roundStartTime = 0;

    // Pick level configuration (Level 1 defaults to 2x2 = 2 pairs)
    const cfg = LEVEL_CONFIGS[this._level] || LEVEL_CONFIGS[5];
    const { cols, rows, cardW, cardH, gap, radius, previewSec } = cfg;
    const totalPairs = (cols * rows) / 2;
    this._totalPairs = totalPairs;

    // Pick random fruits
    const pool = [];
    for (let i = 1; i <= TOTAL_FRUIT_IMAGES; i++) pool.push(i);
    Phaser.Utils.Array.Shuffle(pool);
    const chosen = pool.slice(0, totalPairs);

    // Create pairs and shuffle
    const deck = [...chosen, ...chosen];
    Phaser.Utils.Array.Shuffle(deck);

    // Grid layout centered in available viewport
    const gridW = cols * cardW + (cols - 1) * gap;
    const gridH = rows * cardH + (rows - 1) * gap;
    const startX = (W - gridW) / 2 + cardW / 2;
    const startY = (H - gridH) / 2 + cardH / 2 + 42; // leave room for top HUD

    deck.forEach((fruitIdx, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      this._createCard(x, y, fruitIdx, i, cardW, cardH, radius);
    });

    this._updateHUD();

    // Show all cards face-up during preview
    this._cards.forEach(c => this._showFace(c, false));

    // Display preview countdown banner + "Start Now" button
    this._showPreviewUI(previewSec);
  }

  // ── Preview UI with Memorize Countdown + Start Now Button ───
  _showPreviewUI(previewSec) {
    const W = this.scale.width;
    const H = this.scale.height;

    if (this._previewContainer) {
      this._previewContainer.destroy();
    }

    this._previewContainer = this.add.container(W / 2, H - 45).setDepth(100);

    // Background pill
    const pill = this.add.graphics();
    pill.fillStyle(0x13380b, 0.94);
    pill.fillRoundedRect(-190, -24, 380, 48, 24);
    pill.lineStyle(2, 0x55cc3b, 1);
    pill.strokeRoundedRect(-190, -24, 380, 48, 24);
    this._previewContainer.add(pill);

    let remaining = previewSec;
    const label = this.add.text(-40, 0, `🧠 Memorize! ${remaining}s`, {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold",
      color: COL_GOLD, stroke: "#071504", strokeThickness: 3,
    }).setOrigin(0.5);
    this._previewContainer.add(label);

    // Start Now button (allows skipping preview right away)
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2d6a1e, 1);
    btnBg.fillRoundedRect(70, -18, 105, 36, 12);
    btnBg.lineStyle(1.5, 0x7ddf64, 1);
    btnBg.strokeRoundedRect(70, -18, 105, 36, 12);
    this._previewContainer.add(btnBg);

    const btnText = this.add.text(122, 0, "Start Now ⚡", {
      fontFamily: FONT, fontSize: "14px", fontStyle: "bold", color: COL_WHITE,
    }).setOrigin(0.5);
    this._previewContainer.add(btnText);

    const hit = this.add.rectangle(122, 0, 105, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this._previewContainer.add(hit);

    hit.on("pointerover", () => btnText.setColor(COL_GOLD));
    hit.on("pointerout", () => btnText.setColor(COL_WHITE));
    hit.on("pointerdown", () => {
      this._endPreview();
    });

    // Countdown tick
    this._previewCountdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: previewSec - 1,
      callback: () => {
        remaining--;
        if (label && label.active) {
          label.setText(remaining > 0 ? `🧠 Memorize! ${remaining}s` : "🔄 Flipping...");
        }
      }
    });

    // Auto-end preview timer
    this._previewTimer = this.time.delayedCall(previewSec * 1000, () => {
      this._endPreview();
    });
  }

  // ── End preview and start active play ───────────────────────
  _endPreview() {
    if (!this._isPreviewing) return;
    this._isPreviewing = false;

    if (this._previewTimer) {
      this._previewTimer.remove();
      this._previewTimer = null;
    }
    if (this._previewCountdownEvent) {
      this._previewCountdownEvent.remove();
      this._previewCountdownEvent = null;
    }
    if (this._previewContainer) {
      this._previewContainer.destroy();
      this._previewContainer = null;
    }

    // Staggered flip face-down
    this._cards.forEach((card, idx) => {
      this.time.delayedCall(idx * 35, () => {
        this._showBack(card, true);
      });
    });

    const finishDelay = this._cards.length * 35 + FLIP_DURATION + 40;
    this.time.delayedCall(finishDelay, () => {
      this._roundStartTime = this.time.now;
    });
  }

  // ── Create a single card with robust hit zone ───────────────
  _createCard(x, y, fruitIdx, index, cardW, cardH, radius) {
    const container = this.add.container(x, y).setDepth(10);

    // Front face (fruit image)
    const faceGfx = this.add.graphics();
    faceGfx.fillStyle(COL_CARD_FACE, 1);
    faceGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, radius);
    faceGfx.lineStyle(3, COL_CARD_FACE_BORDER, 1);
    faceGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, radius);

    const fruitImg = this.add.image(0, 0, `fruit-${fruitIdx}`);
    const imgSize = Math.min(cardW - 32, cardH - 32);
    fruitImg.setDisplaySize(imgSize, imgSize);

    // Back face (green card back with leaf)
    const backGfx = this.add.graphics();
    backGfx.fillStyle(COL_CARD_BACK, 1);
    backGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, radius);
    backGfx.lineStyle(3, COL_CARD_BACK_BORDER, 1);
    backGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, radius);

    const backLabel = this.add.text(0, 0, "🌱", {
      fontSize: `${Math.round(cardH * 0.28)}px`,
    }).setOrigin(0.5);

    // Dedicated hit zone rectangle with pointer cursor
    const hitZone = this.add.rectangle(0, 0, cardW, cardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    container.add([faceGfx, fruitImg, backGfx, backLabel, hitZone]);

    const card = {
      container,
      fruitIdx,
      index,
      faceGfx,
      fruitImg,
      backGfx,
      backLabel,
      hitZone,
      faceUp: false,
      isFlipping: false,
      matched: false,
      cardW,
      cardH,
    };

    // Hover feedback
    hitZone.on("pointerover", () => {
      if (!card.matched && !card.faceUp && !this._isPreviewing) {
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
      }
    });

    hitZone.on("pointerout", () => {
      if (!card.matched && !card.faceUp) {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
      }
    });

    // One-click flip handler
    hitZone.on("pointerdown", () => {
      this._onCardClick(card);
    });

    this._cards.push(card);
    return card;
  }

  // ── Responsive Card Click Logic ─────────────────────────────
  // Flips smoothly with 1 click. If 2 mismatched cards are open,
  // clicking any other card immediately flips the old cards down
  // and the new card up without dropping the click.
  _onCardClick(card) {
    if (this._isPreviewing) return; // cards are being previewed
    if (card.matched) return;        // already solved
    if (card.faceUp || card.isFlipping) return; // already face up or animating

    // If 2 mismatched cards are currently displayed, immediately dismiss them on this click
    if (this._flippedCards.length >= 2) {
      if (this._mismatchTimer) {
        this._mismatchTimer.remove();
        this._mismatchTimer = null;
      }
      const [oldA, oldB] = this._flippedCards;
      this._flippedCards = [];
      if (oldA && !oldA.matched) this._showBack(oldA, true);
      if (oldB && !oldB.matched) this._showBack(oldB, true);
    }

    // Now flip the clicked card immediately
    this._clicks++;
    this._showFace(card, true);
    this._flippedCards.push(card);

    if (this._flippedCards.length === 2) {
      const [a, b] = this._flippedCards;

      if (a.fruitIdx === b.fruitIdx) {
        // ✅ Match!
        this._hits++;
        this._matchedPairs++;
        this._score += 100 + Math.max(0, 50 - this._clicks * 2);

        a.matched = true;
        b.matched = true;
        this._flippedCards = [];

        // Gentle bounce celebration
        [a, b].forEach(c => {
          this.tweens.add({
            targets: c.container,
            scaleX: 1.12, scaleY: 1.12,
            duration: 160, yoyo: true,
            onComplete: () => {
              c.container.setAlpha(0.88);
            }
          });
        });

        this._showFloatingText(
          (a.container.x + b.container.x) / 2,
          Math.min(a.container.y, b.container.y) - 50,
          "✨ Match! ✨", COL_GOLD
        );

        this._updateHUD();

        // Check if level cleared
        if (this._matchedPairs >= this._totalPairs) {
          this.time.delayedCall(450, () => this._onRoundWin());
        }
      } else {
        // ❌ Mismatch: Every card can flip even if not right!
        // Stays open briefly or closes immediately when another card is clicked.
        this._misses++;
        this._showFloatingText(
          (a.container.x + b.container.x) / 2,
          Math.min(a.container.y, b.container.y) - 50,
          "✗ Try Again", COL_RED
        );
        this._updateHUD();

        this._mismatchTimer = this.time.delayedCall(650, () => {
          if (this._flippedCards.length === 2) {
            this._showBack(a, true);
            this._showBack(b, true);
            this._flippedCards = [];
          }
          this._mismatchTimer = null;
        });
      }
    }
  }

  // ── Smooth & Snappy Card Animations ─────────────────────────
  _showFace(card, animate) {
    card.faceUp = true;
    if (animate) {
      card.isFlipping = true;
      this.tweens.killTweensOf(card.container);
      this.tweens.add({
        targets: card.container,
        scaleX: 0,
        duration: FLIP_DURATION / 2,
        ease: "Sine.easeIn",
        onComplete: () => {
          card.backGfx.setVisible(false);
          card.backLabel.setVisible(false);
          card.faceGfx.setVisible(true);
          card.fruitImg.setVisible(true);
          this.tweens.add({
            targets: card.container,
            scaleX: 1,
            scaleY: 1,
            duration: FLIP_DURATION / 2,
            ease: "Sine.easeOut",
            onComplete: () => {
              card.isFlipping = false;
            }
          });
        }
      });
    } else {
      card.backGfx.setVisible(false);
      card.backLabel.setVisible(false);
      card.faceGfx.setVisible(true);
      card.fruitImg.setVisible(true);
      card.container.setScale(1);
      card.isFlipping = false;
    }
  }

  _showBack(card, animate) {
    card.faceUp = false;
    if (animate) {
      card.isFlipping = true;
      this.tweens.killTweensOf(card.container);
      this.tweens.add({
        targets: card.container,
        scaleX: 0,
        duration: FLIP_DURATION / 2,
        ease: "Sine.easeIn",
        onComplete: () => {
          card.backGfx.setVisible(true);
          card.backLabel.setVisible(true);
          card.faceGfx.setVisible(false);
          card.fruitImg.setVisible(false);
          this.tweens.add({
            targets: card.container,
            scaleX: 1,
            scaleY: 1,
            duration: FLIP_DURATION / 2,
            ease: "Sine.easeOut",
            onComplete: () => {
              card.isFlipping = false;
            }
          });
        }
      });
    } else {
      card.backGfx.setVisible(true);
      card.backLabel.setVisible(true);
      card.faceGfx.setVisible(false);
      card.fruitImg.setVisible(false);
      card.container.setScale(1);
      card.isFlipping = false;
    }
  }

  // ── HUD update ─────────────────────────────────────────────
  _updateHUD() {
    this._levelText.setText(`Level ${this._level}`);
    this._scoreText.setText(`⭐ ${this._score}`);
    this._pairsText.setText(`Pairs: ${this._matchedPairs} / ${this._totalPairs}`);
  }

  // ── Timer (update loop) ────────────────────────────────────
  update() {
    if (this._gameOver) return;
    if (this._roundStartTime > 0 && !this._isPreviewing) {
      const elapsed = Math.floor((this.time.now - this._roundStartTime) / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      this._timerText.setText(`⏱ ${min}:${sec.toString().padStart(2, "0")}`);
    }
  }

  // ── Round win ──────────────────────────────────────────────
  _onRoundWin() {
    const elapsed = this._roundStartTime > 0
      ? Math.floor((this.time.now - this._roundStartTime) / 1000)
      : 1;
    const timeBonus = Math.max(0, 200 - elapsed * 4);
    this._score += timeBonus;
    this._updateHUD();

    const W = this.scale.width;
    const H = this.scale.height;

    // Victory popup container
    const popup = this.add.container(W / 2, H / 2).setDepth(200).setScale(0.5);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x091c06, 0.94);
    overlay.fillRoundedRect(-240, -170, 480, 340, 24);
    overlay.lineStyle(3, 0x55cc3b, 1);
    overlay.strokeRoundedRect(-240, -170, 480, 340, 24);
    popup.add(overlay);

    const totalClicks = this._clicks;
    const accuracyPct = totalClicks > 0
      ? Math.round((this._hits / totalClicks) * 100)
      : 0;

    const title = this.add.text(0, -130, `🎉 Level ${this._level} Complete! 🎉`, {
      fontFamily: FONT, fontSize: "27px", fontStyle: "bold",
      color: COL_GOLD, stroke: "#071504", strokeThickness: 4,
    }).setOrigin(0.5);
    popup.add(title);

    const lines = [
      `Score: ${this._score}  (Speed bonus: +${timeBonus})`,
      `Clicks: ${totalClicks}`,
      `Matches: ${this._hits}   Misses: ${this._misses}`,
      `Accuracy: ${accuracyPct}%`,
      `Time: ${elapsed}s`,
    ];
    lines.forEach((line, i) => {
      const stat = this.add.text(0, -75 + i * 30, line, {
        fontFamily: FONT, fontSize: "18px", color: COL_WHITE,
      }).setOrigin(0.5);
      popup.add(stat);
    });

    // Save to Supabase garden table
    this._saveStats();

    // Next Level Button
    const nextBtnGfx = this.add.graphics();
    nextBtnGfx.fillStyle(0x2d6a1e, 1);
    nextBtnGfx.fillRoundedRect(-110, 85, 220, 44, 12);
    nextBtnGfx.lineStyle(2, 0x7ddf64, 1);
    nextBtnGfx.strokeRoundedRect(-110, 85, 220, 44, 12);
    popup.add(nextBtnGfx);

    const hasNextLevel = this._level < 5;
    const nextBtnText = this.add.text(0, 107, hasNextLevel ? "Next Level ➔" : "🔄 Play Again", {
      fontFamily: FONT, fontSize: "19px", fontStyle: "bold",
      color: COL_WHITE, stroke: "#071504", strokeThickness: 3,
    }).setOrigin(0.5);
    popup.add(nextBtnText);

    const nextHit = this.add.rectangle(0, 107, 220, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    popup.add(nextHit);

    nextHit.on("pointerover", () => {
      nextBtnText.setColor(COL_GOLD);
      nextBtnGfx.clear();
      nextBtnGfx.fillStyle(0x3a8226, 1);
      nextBtnGfx.fillRoundedRect(-110, 85, 220, 44, 12);
      nextBtnGfx.lineStyle(2, 0xffd700, 1);
      nextBtnGfx.strokeRoundedRect(-110, 85, 220, 44, 12);
    });
    nextHit.on("pointerout", () => {
      nextBtnText.setColor(COL_WHITE);
      nextBtnGfx.clear();
      nextBtnGfx.fillStyle(0x2d6a1e, 1);
      nextBtnGfx.fillRoundedRect(-110, 85, 220, 44, 12);
      nextBtnGfx.lineStyle(2, 0x7ddf64, 1);
      nextBtnGfx.strokeRoundedRect(-110, 85, 220, 44, 12);
    });
    nextHit.on("pointerdown", () => {
      popup.destroy();
      this._clicks = 0;
      this._hits = 0;
      this._misses = 0;
      if (hasNextLevel) {
        this._level++;
      }
      this._buildRound();
    });

    // Lobby link
    const lobbyText = this.add.text(0, 146, "← Back to Lobby", {
      fontFamily: FONT, fontSize: "14px", color: "#c9b87a",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    popup.add(lobbyText);

    lobbyText.on("pointerover", () => lobbyText.setColor(COL_GOLD));
    lobbyText.on("pointerout", () => lobbyText.setColor("#c9b87a"));
    lobbyText.on("pointerdown", () => {
      window.location.href = "/lobby";
    });

    // Pop-in tween
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 350,
      ease: "Back.easeOut",
    });
  }

  // ── Save stats to Supabase 'garden' table ────────────────────
  _saveStats() {
    const totalAttempts = this._clicks;
    const totalCorrect = this._hits;
    const totalWrong = this._misses;
    const accuracyPct = totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;
    const missratePct = totalAttempts > 0
      ? Math.round((totalWrong / totalAttempts) * 100)
      : 0;

    try {
      window.__saveGarden?.({
        clicks: totalAttempts,
        hits: totalCorrect,
        misses: totalWrong,
        score: this._score,
        accuracy: accuracyPct,
        missrate: missratePct,
      });
    } catch (e) {
      console.error("saveGarden error:", e);
    }
  }

  // ── Floating text animation ─────────────────────────────────
  _showFloatingText(x, y, msg, color) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: FONT, fontSize: "22px", fontStyle: "bold",
      color, stroke: "#071504", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: txt,
      y: y - 45,
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeOut",
      onComplete: () => txt.destroy(),
    });
  }
}
