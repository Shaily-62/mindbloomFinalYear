import React, { useEffect } from "react";
import Phaser from "phaser";
import SwampScene from "../game/SwampScene";
import DesertScene from "../game/DesertScene";
import { saveSwampSession } from "../lib/gameStats";

export default function Swamp() {
  useEffect(() => {
    const container = document.getElementById("mindbloom-swamp");
    if (container) {
      container.innerHTML = "";
    }

    // Expose a global save callback so Phaser (non-React) can call it
    const childId = localStorage.getItem("childId");
    window.__saveSwamp = (stats) => saveSwampSession(childId, stats);

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
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [SwampScene, DesertScene],
    };

    const game = new Phaser.Game(config);

    return () => {
      window.__saveSwamp = null;
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
