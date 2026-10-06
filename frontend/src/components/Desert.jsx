import React, { useEffect } from "react";
import Phaser from "phaser";
import DesertScene from "../game/DesertScene";

export default function Desert() {
  useEffect(() => {
    const container = document.getElementById("mindbloom-desert");
    if (container) {
      container.innerHTML = "";
    }

    // Read score/level from URL query parameters if present
    const params = new URLSearchParams(window.location.search);
    const initialScore = parseInt(params.get("score") || "0", 10);
    const initialLevel = parseInt(params.get("level") || "1", 10);

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "mindbloom-desert",
      backgroundColor: "#2a1a05",
      pixelArt: true,
      roundPixels: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 300 },
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [DesertScene],
    };

    const game = new Phaser.Game(config);

    // Pass data into DesertScene after scene starts
    game.events.once("ready", () => {
      const scene = game.scene.getScene("DesertScene");
      if (scene) {
        scene.init({ score: initialScore, level: initialLevel, from: "swamp" });
      }
    });

    return () => {
      try {
        game.destroy(true);
      } catch (e) {
        // ignore
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      className="desert-page"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#120a02",
        overflow: "hidden",
      }}
    >
      <div id="mindbloom-desert"></div>
    </div>
  );
}
