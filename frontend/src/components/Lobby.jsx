import React, { useEffect } from "react";
import Phaser from "phaser";
import LobbyScene from "../game/LobbyScene";
import { supabase } from "../lib/supabase";   // adjust path
import "./Lobby.css";

const getChildId = () => localStorage.getItem("childId");   // adjust to your auth

export default function Lobby() {
  useEffect(() => {
    let game = null;
    let cancelled = false;
    const container = document.getElementById("mindbloom-lobby");
    if (container) container.innerHTML = "";

    (async () => {
      const childId = getChildId();
      let child = { id: childId, name: "Player" };
      let saved = { character: null, moves: 0, days: 0 };

      if (childId) {
        const { data: c } = await supabase
          .from("children").select("id, name").eq("id", childId).maybeSingle();
        if (c) child = c;

        const { data: l } = await supabase
          .from("lobby").select("character, moves, days").eq("child_id", childId).maybeSingle();
        if (l) saved = { character: l.character, moves: l.moves ?? 0, days: l.days ?? 0 };
      }
      if (cancelled) return;

      // Single upsert keyed on child_id; name always comes from `children`
      const state = { ...saved };
      const saveLobby = async (patch) => {
        Object.assign(state, patch);
        if (!child.id) return;
        const { error } = await supabase.from("lobby").upsert(
          {
            child_id: child.id,
            name: child.name,
            character: state.character ?? "boy",
            moves: state.moves,
            days: state.days,
          },
          { onConflict: "child_id" }
        );
        if (error) console.error("lobby save failed:", error.message);
      };

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: "mindbloom-lobby",
        backgroundColor: "#0d1f2d",
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
        scene: [],
      });
      game.scene.add("LobbyScene", LobbyScene, true, { child, saved, saveLobby });
    })();

    return () => {
      cancelled = true;
      try { game?.destroy(true); } catch (e) { /* ignore */ }
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div className="lobby-page">
      <div id="mindbloom-lobby"></div>
    </div>
  );
}