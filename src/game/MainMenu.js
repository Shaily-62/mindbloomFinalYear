import Phaser from "phaser";

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.image("layer1", "/game-assests/intro/1.png");
    this.load.image("layer2", "/game-assests/intro/2.png");
    this.load.image("layer3", "/game-assests/intro/3.png");
    this.load.image("layer4", "/game-assests/intro/4.png");
  }

  create() {
    const { width, height } = this.scale;

    // Background layers
    ["layer1", "layer2", "layer3", "layer4"].forEach((key, i) => {
      this.add.image(width / 2, height / 2, key)
        .setDisplaySize(width, height)
        .setDepth(i);
    });

    const FONT = "'Cedarville Cursive', cursive"; // same font for everything

    // TITLE
    this.add.text(width / 2, height * 0.28, "Mindbloom", {
      fontFamily: FONT,
      fontSize: "72px",
      color: "#ffffff",
      stroke: "#1b290f",
      strokeThickness: 4,
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(10);

    // MENU
    const menuItems = ["Play", "Lobby", "Quit"];

    menuItems.forEach((item, index) => {
      const button = this.add.text(
        width / 2,
        height * 0.48 + index * 65,
        item,
        {
          fontFamily: FONT,
          fontSize: "36px",
          color: "#f5fbef",
          stroke: "#1b290f",
          strokeThickness: 4,
        }
      )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      button.on("pointerover", () => {
        button.setColor("#dbe9a6");
        this.tweens.add({
          targets: button,
          scale: 1.08,
          duration: 120,
          ease: "Quad.easeOut",
        });
      });

      button.on("pointerout", () => {
        button.setColor("#f5fbef");
        this.tweens.add({
          targets: button,
          scale: 1,
          duration: 120,
          ease: "Quad.easeOut",
        });
      });

      button.on("pointerdown", () => {
        const itemUpper = item.toUpperCase();

        if (itemUpper === "PLAY") {
          console.log("PLAY clicked");
        }

        if (itemUpper === "LOBBY") {
          const navigate = this.registry.get("navigate");
          if (typeof navigate === "function") {
            navigate("/lobby");
          } else {
            window.location.href = "/lobby";
          }
        }

        if (itemUpper === "QUIT") {
          console.log("QUIT clicked");
        }
      });
    });
  }
}