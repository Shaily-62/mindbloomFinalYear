import React, { useEffect } from "react";
import Phaser from "phaser";
import GardenScene from "../game/GardenScene";
import { saveGardenSession } from "../lib/gameStats";

export default function Garden() {
  useEffect(() => {
    const container = document.getElementById("mindbloom-garden");
    if (container) {
      container.innerHTML = "";
    }

    // Expose a global save callback so Phaser (non-React) can call it
    const childId = localStorage.getItem("childId");
    window.__saveGarden = (stats) => saveGardenSession(childId, stats);

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "mindbloom-garden",
      backgroundColor: "#0a1a06",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [GardenScene],
    };

    const game = new Phaser.Game(config);

    return () => {
      window.__saveGarden = null;
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
      className="garden-page"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1a06",
        overflow: "hidden",
      }}
    >
      <div id="mindbloom-garden"></div>
    </div>
  );
}
