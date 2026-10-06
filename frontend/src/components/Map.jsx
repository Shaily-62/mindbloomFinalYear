import React, { useEffect } from "react";
import Phaser from "phaser";
import MapScene from "../game/MapScene";

export default function Map() {

  useEffect(() => {

    const container = document.getElementById("mindbloom-map");
    if (container) {
      container.innerHTML = "";
    }

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "mindbloom-map",
      backgroundColor: "#3a5a1c",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [MapScene],
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
    <div className="map-page" style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a2e10", overflow: "hidden" }}>
      <div id="mindbloom-map"></div>
    </div>
  );
}