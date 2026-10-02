import React, { useEffect } from "react";
import Phaser from "phaser";
import LobbyScene from "../game/LobbyScene";
import "./Lobby.css";

export default function Lobby() {

  useEffect(() => {
    const container = document.getElementById("mindbloom-lobby");
    if (container) {
      container.innerHTML = "";
    }

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: "mindbloom-lobby",
      backgroundColor: "#0d1f2d",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      scene: [LobbyScene]
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
    <div className="lobby-page">
      <div id="mindbloom-lobby"></div>
    </div>
  );
}