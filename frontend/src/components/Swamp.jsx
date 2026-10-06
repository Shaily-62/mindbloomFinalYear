import React, { useEffect } from "react";
import Phaser from "phaser";
import SwampScene from "../game/SwampScene";
import DesertScene from "../game/DesertScene";
export default function Swamp() {
  useEffect(() => {
    const container = document.getElementById("mindbloom-swamp");
    if (container) {
      container.innerHTML = "";
    }

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "mindbloom-swamp",
      backgroundColor: "#0d1a0e",
      pixelArt: true,
      roundPixels: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 300 },
          // debug: true, // uncomment to see physics bodies
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [SwampScene,DesertScene],
    };

    const game = new Phaser.Game(config);

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
      className="swamp-page"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#081008",
        overflow: "hidden",
      }}
    >
      <div id="mindbloom-swamp"></div>
    </div>
  );
}
