import Phaser from "phaser";

const FONT = "'Cedarville Cursive', cursive";

const COLORS = {
  meadow: 0x95c060,
  meadowDots: 0xb3d879,
  swamp: 0x628f3c,
  swampDots: 0x7aa84a,
  swampEdge: 0x3d5f27,
  swampLip: 0x4b7430,
};

const SWAMP_SHAPES = [
  [
    { x: -60, y: -60 }, { x: 1340, y: -60 }, { x: 1340, y: 250 },
    { x: 1200, y: 275 }, { x: 1050, y: 255 }, { x: 900, y: 285 },
    { x: 740, y: 262 }, { x: 580, y: 290 }, { x: 420, y: 262 },
    { x: 260, y: 285 }, { x: 120, y: 258 }, { x: -60, y: 280 },
  ],
  [
    { x: 420, y: 470 }, { x: 560, y: 455 }, { x: 700, y: 470 },
    { x: 715, y: 560 }, { x: 700, y: 655 }, { x: 560, y: 668 },
    { x: 430, y: 655 }, { x: 410, y: 560 },
  ],
  [
    { x: 930, y: 430 }, { x: 1070, y: 414 }, { x: 1210, y: 432 },
    { x: 1232, y: 530 }, { x: 1210, y: 640 }, { x: 1070, y: 658 },
    { x: 945, y: 640 }, { x: 918, y: 535 },
  ],
];

const LEVELS = [
  { num: 1, x: 130, y: 590, unlocked: true, name: "Mossy Start" },
  { num: 2, x: 265, y: 450, unlocked: true, name: "Muddy Trail" },
  { num: 3, x: 430, y: 365, unlocked: true, name: "Boggy Hollow" },
  { num: 4, x: 640, y: 375, unlocked: false, name: "Swamp Depths" },
  { num: 5, x: 800, y: 540, unlocked: false, name: "Toxic Glade" },
  { num: 6, x: 940, y: 335, unlocked: false, name: "Skull Marsh" },
  { num: 7, x: 1110, y: 320, unlocked: false, name: "Shadowcave" },
];

const PROP_FILES = {
  "p-tree-tall": "Tree Tower Tall",
  "p-tree-short": "Tree Tower Short",
  "p-house": "House",
  "p-cave": "Cave Enterance",
  "p-boulder1": "Boulder 1",
  "p-boulder2": "Boulder 2",
  "p-boulder3": "Boulder 3",
  "p-bush1": "Bushes 1",
  "p-bush2": "Bushes 2",
  "p-bush3": "Bushes 3",
  "p-shrub1": "Shrub Swamp 1",
  "p-shrub2": "Shrub Swamp 2",
  "p-shrub3": "Shrub Swamp 3",
  "p-rock1": "Rock 1",
  "p-rock2": "Rock 2",
  "p-rock3": "Rock 3",
  "p-rock4": "Rock 4",
  "p-rock5": "Rock 5",
  "p-sticks1": "Sticks 1",
  "p-sticks2": "Sticks 2",
  "p-sticks3": "Sticks 3",
  "p-sticks4": "Sticks 4",
  "p-sticks5": "Sticks 5",
  "p-rafflesia": "Rafflesia",
  "p-lantern": "Lantern",
  "p-flag": "Flag",
  "p-skeleton": "Animal Skeleton",
  "p-leaf1": "Leaf on the Water 1",
  "p-leaf2": "Leaf on the Water 2",
  "p-leaf3": "Leaf on the Water 3",
  "p-water1": "Water Plant 1",
  "p-water2": "Water Plant 2",
  "p-water3": "Water Plant 3",
  "p-danger": "Danger Sign",
  "p-boat": "Broken Boat",
  "p-floor-h": "Wooden Floor Horizontal",
};

// [key, x, y (bottom-centre), height]
const PROPS = [
  ["p-tree-tall", 150, 225, 200],
  ["p-tree-short", 420, 215, 180],
  ["p-house", 690, 245, 175],
  ["p-tree-tall", 1020, 220, 190],
  ["p-cave", 1190, 255, 140],

  ["p-boulder1", 70, 160, 70],
  ["p-boulder2", 1245, 135, 70],
  ["p-shrub1", 290, 160, 56],
  ["p-shrub2", 560, 135, 54],
  ["p-bush1", 830, 125, 50],
  ["p-sticks4", 1110, 150, 60],
  ["p-sticks1", 250, 245, 58],
  ["p-sticks2", 560, 250, 58],
  ["p-skeleton", 820, 252, 48],
  ["p-danger", 500, 250, 56],
  ["p-lantern", 330, 248, 46],
  ["p-lantern", 770, 252, 46],
  ["p-lantern", 940, 250, 46],
  ["p-rock3", 365, 245, 26],
  ["p-rock2", 1090, 245, 26],

  ["p-flag", 195, 640, 50],
  ["p-rafflesia", 60, 480, 58],
  ["p-bush2", 105, 520, 46],
  ["p-rock1", 170, 520, 24],
  ["p-shrub3", 190, 700, 52],
  ["p-bush3", 250, 705, 44],
  ["p-rock4", 305, 700, 22],
  ["p-leaf1", 330, 600, 30],
  ["p-tree-tall", 60, 705, 190],

  ["p-rafflesia", 545, 335, 58],
  ["p-rock5", 500, 420, 22],
  ["p-lantern", 340, 420, 44],

  ["p-shrub3", 505, 565, 52],
  ["p-bush3", 625, 610, 46],
  ["p-leaf2", 450, 620, 28],
  ["p-skeleton", 640, 525, 44],
  ["p-floor-h", 560, 665, 44],

  ["p-lantern", 720, 470, 44],
  ["p-bush1", 740, 650, 48],
  ["p-rock1", 790, 680, 24],

  ["p-boulder3", 990, 505, 72],
  ["p-sticks3", 965, 605, 56],
  ["p-water1", 1185, 525, 42],
  ["p-leaf3", 1040, 628, 28],
  ["p-tree-short", 1130, 610, 170],
  ["p-boat", 1050, 700, 90],
  ["p-water2", 880, 690, 34],
  ["p-tree-tall", 1225, 705, 190],

  ["p-flag", 1060, 330, 50],
  ["p-water3", 1190, 395, 36],
  ["p-sticks5", 1170, 340, 52],
  ["p-rock1", 1000, 340, 22],
];

function smoothClosed(pts, seg = 10) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
}

export default class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  preload() {
    const BASE = "/game-assests/map/Top-Down Poisonous Swamp_";
    Object.entries(PROP_FILES).forEach(([key, file]) => {
      this.load.image(key, `${BASE}Prop - ${file}.png`);
    });
  }

  create() {
    const W = this.scale.width;

    this._drawTerrain();
    PROPS.forEach(([key, x, y, h]) => this._place(key, x, y, h));
    this._drawPath();
    LEVELS.forEach((node) => this._createLevelNode(node));

    this.add.text(W / 2 + 2, 38, "World Map", {
      fontFamily: FONT, fontSize: "48px", color: "#1a2e10",
    }).setOrigin(0.5).setDepth(30);

    this.add.text(W / 2, 36, "World Map", {
      fontFamily: FONT, fontSize: "48px",
      color: "#f0fbdb", stroke: "#2d4a18", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(31);

    const back = this.add.text(20, 16, "← Back", {
      fontFamily: FONT, fontSize: "24px",
      color: "#f0fbdb", stroke: "#1a2e10", strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(32).setInteractive({ useHandCursor: true });

    back.on("pointerover", () => back.setColor("#c8e86a"));
    back.on("pointerout", () => back.setColor("#f0fbdb"));
    back.on("pointerdown", () => window.history.back());
  }

  _drawTerrain() {
    const W = this.scale.width;
    const H = this.scale.height;
    const gfx = this.add.graphics().setDepth(1);

    gfx.fillStyle(COLORS.meadow, 1).fillRect(0, 0, W, H);

    const shapes = SWAMP_SHAPES.map((pts) => smoothClosed(pts));

    shapes.forEach((poly) => {
      gfx.fillStyle(COLORS.swampLip, 1);
      gfx.fillPoints(poly.map((p) => ({ x: p.x, y: p.y + 8 })), true);
    });

    shapes.forEach((poly) => {
      gfx.fillStyle(COLORS.swamp, 1);
      gfx.fillPoints(poly, true);
      gfx.lineStyle(4, COLORS.swampEdge, 1);
      gfx.strokePoints(poly, true);
    });

    const geoms = shapes.map((poly) => new Phaser.Geom.Polygon(poly));
    const rnd = new Phaser.Math.RandomDataGenerator(["mindbloom"]);
    const dots = this.add.graphics().setDepth(2);

    for (let i = 0; i < 260; i++) {
      const x = rnd.between(10, W - 10);
      const y = rnd.between(10, H - 10);
      const inSwamp = geoms.some((p) => p.contains(x, y));
      dots.fillStyle(inSwamp ? COLORS.swampDots : COLORS.meadowDots, 1);
      dots.fillCircle(x, y, rnd.between(2, 4));
    }
  }

  _place(key, x, y, h) {
    const img = this.add.image(x, y, key).setOrigin(0.5, 1);
    img.setScale(h / img.height);
    img.setDepth(7 + y / 1000);
    return img;
  }

  _drawPath() {
    const points = LEVELS.map((n) => new Phaser.Math.Vector2(n.x, n.y));
    const spline = new Phaser.Curves.Spline(points);

    [
      [5, 24, 0x3b2b14, 1],
      [5.1, 16, 0x7a5a30, 1],
      [5.2, 8, 0xc2a36a, 0.9],
    ].forEach(([depth, width, color, alpha]) => {
      const gfx = this.add.graphics().setDepth(depth);
      gfx.lineStyle(width, color, alpha);
      spline.draw(gfx, 120);
    });
  }

  _createLevelNode({ num, x, y, unlocked, name }) {
    if (unlocked) {
      const halo = this.add.circle(x, y, 40, 0xc8e86a, 0.25).setDepth(20);
      this.tweens.add({
        targets: halo,
        scaleX: 1.6,
        scaleY: 1.6,
        alpha: 0,
        duration: 1600,
        repeat: -1,
        ease: "Sine.easeOut",
      });
    }

    const shadow = this.add.ellipse(x + 3, y + 4, 62, 62, 0x000000, 0.25).setDepth(20.5);

    const outerRing = this.add
      .circle(x, y, 30, unlocked ? 0x5a9a20 : 0x2e3e25)
      .setStrokeStyle(4, unlocked ? 0xe8f5c0 : 0x4a5e3a, 1)
      .setDepth(21);

    const innerDisc = this.add
      .circle(x, y, 22, unlocked ? 0x3a7010 : 0x1e2c16)
      .setDepth(21.5);

    const numLabel = unlocked
      ? this.add
          .text(x, y + 1, String(num), { fontFamily: FONT, fontSize: "26px", color: "#f0fbdb" })
          .setOrigin(0.5)
          .setDepth(22)
      : this.add
          .text(x, y + 1, "🔒", { fontSize: "16px" })
          .setOrigin(0.5)
          .setDepth(22);

    const nameText = this.add
      .text(x, y + 46, name, {
        fontFamily: FONT,
        fontSize: "20px",
        color: unlocked ? "#d9f08a" : "#9fb38a",
        stroke: "#0e1a08",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(22);

    const pill = this.add.graphics().setDepth(21.8);
    pill.fillStyle(0x0e1a08, 0.55);
    pill.fillRoundedRect(
      nameText.x - nameText.width / 2 - 10,
      nameText.y - 2,
      nameText.width + 20,
      nameText.height + 4,
      10
    );

    this.time.delayedCall((num - 1) * 300, () => {
      this.tweens.add({
        targets: [shadow, outerRing, innerDisc, numLabel, nameText, pill],
        y: "-=7",
        duration: 1100,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    });

    if (!unlocked) return;

    const hit = this.add
      .circle(x, y, 34, 0x000000, 0)
      .setDepth(23)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      outerRing.setStrokeStyle(5, 0xffffff, 1);
      this.tweens.add({
        targets: [outerRing, innerDisc, numLabel],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
      });
      nameText.setColor("#ffffff");
    });

    hit.on("pointerout", () => {
      outerRing.setStrokeStyle(4, 0xe8f5c0, 1);
      this.tweens.add({
        targets: [outerRing, innerDisc, numLabel],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
      nameText.setColor("#d9f08a");
    });

    hit.on("pointerdown", () => {
      this.tweens.add({
        targets: [outerRing, innerDisc],
        alpha: 0.35,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          if (num === 1) {
            window.location.href = "/swamp";
          } else {
            console.log(`Level ${num} selected: ${name}`);
          }
        },
      });
    });

    this.time.delayedCall((num - 1) * 300, () => {
      this.tweens.add({
        targets: hit,
        y: "-=7",
        duration: 1100,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }
}