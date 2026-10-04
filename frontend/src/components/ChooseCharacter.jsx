import React, { useEffect } from "react";
import Phaser from "phaser";
import ChooseCharacterScene from "../game/ChooseCharacterScene";
import "./Lobby.css";   // reuse same fullscreen CSS

export default function ChooseCharacter() {

  useEffect(() => {

    // Inject Pacifico cursive font from Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Pacifico&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Wait for the font to load, then start Phaser
    document.fonts.load("16px Pacifico").then(() => {

      const config = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: "mindbloom-choose-character",
        backgroundColor: "#0d1f2d",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1280,
          height: 720,
        },
        scene: [ChooseCharacterScene]
      };

      const game = new Phaser.Game(config);
      window.__chooseCharGame = game;
    });

    return () => {
      if (window.__chooseCharGame) {
        window.__chooseCharGame.destroy(true);
        window.__chooseCharGame = null;
      }
      link.remove();
    };
  }, []);

  return (
    <div className="lobby-page">
      <div id="mindbloom-choose-character"></div>
    </div>
  );
}
