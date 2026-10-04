import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import MainMenu from '../game/MainMenu';
import './Game.css';

export default function Game() {
  const navigate = useNavigate();

  useEffect(() => {
    let game = null;
    let cancelled = false;

    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    document.fonts.load("32px 'Cedarville Cursive'").then(() => {
      if (cancelled) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'mindbloom-game',
        backgroundColor: '#1b290f',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1280,
          height: 720,
        },
        callbacks: {
          // runs before any scene starts, so navigate is always available
          preBoot: (g) => g.registry.set("navigate", navigate),
        },
        scene: [MainMenu],
      });
    });

    return () => {
      cancelled = true;
      if (game) {
        game.destroy(true);
        game = null;
      }
      link.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-page">
      <div id="mindbloom-game"></div>
    </div>
  );
}