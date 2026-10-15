import React, { useEffect, useState } from "react";
import { analyzeHandwriting } from "../lib/screening";
import "./ScreeningResult.css";

const RISK = {
  low: { label: "Low indication", color: "#15803d",
    text: "Few reversed letters were found in this sample." },
  moderate: { label: "Some indication", color: "#b45309",
    text: "A noticeable share of letters looked reversed. Worth keeping an eye on, and worth retesting with another sample." },
  elevated: { label: "Higher indication", color: "#b91c1c",
    text: "Many letters looked reversed. Consider talking to a teacher or specialist for a proper assessment." },
  insufficient_data: { label: "Not enough data", color: "#6b7280",
    text: "Too few clearly readable letters to give a result. Try a clearer, closer photo of one line of writing." },
  no_characters: { label: "No letters found", color: "#6b7280",
    text: "No handwriting could be detected in this image." },
};

export default function ScreeningResult({ child, onClose }) {
  const [state, setState] = useState({ loading: true });
  // Adjust to whatever field your children records use for the bucket path:
  const imagePath = child.handwriting;

  useEffect(() => {
    let alive = true;
    if (!imagePath) {
      setState({ error: "No handwriting image is attached to this profile." });
      return;
    }
    setState({ loading: true });
    analyzeHandwriting(imagePath, child.age)
      .then((result) => alive && setState({ result }))
      .catch((e) => alive && setState({ error: e.message }));
    return () => { alive = false; };
  }, [imagePath, child.age]);

  const r = state.result;
  const risk = r ? RISK[r.risk_level] || RISK.insufficient_data : null;

  return (
    <div className="scr-overlay" onClick={onClose}>
      <div className="scr-panel" onClick={(e) => e.stopPropagation()}>
        <button className="scr-close" onClick={onClose} aria-label="Close">×</button>
        <h2>Handwriting screening: {child.name}</h2>

        {state.loading && <p>Analysing handwriting… this can take a few seconds.</p>}
        {state.error && <p role="alert" style={{ color: "#b91c1c" }}>{state.error}</p>}

        {r && (
          <>
            <span className="scr-badge" style={{ background: risk.color }}>{risk.label}</span>
            <p>{risk.text}</p>

            {r.n_used > 0 && (
              <>
                <p>
                  <b>{r.n_flagged}</b> of <b>{r.n_used}</b> clearly read letters looked
                  reversed ({Math.round(r.reversal_rate * 100)}%)
                </p>
                <div className="scr-bar">
                  <div style={{ width: `${Math.min(r.reversal_rate * 100, 100)}%`, background: risk.color }} />
                </div>
              </>
            )}

            {child.age < 8 && (
              <p className="scr-note">
                At age {child.age}, reversing letters is common, so this result is
                interpreted more cautiously.
              </p>
            )}

            {r.annotated && (
              <>
                <h3>Detected letters</h3>
                <img src={r.annotated} alt="Detected letters" style={{ maxWidth: "100%" }} />
              </>
            )}

            {r.characters.length > 0 && (
              <>
                <h3>Why the model decided this (Grad-CAM)</h3>
                <p className="scr-note">
                  Red and yellow areas show where the model looked when judging each letter.
                </p>
                <div className="scr-grid">
                  {r.characters.map((c) => (
                    <figure key={c.index}
                      className={`scr-card ${c.uncertain ? "scr-card--unsure" : ""}`}>
                      <img src={c.gradcam} alt={`Heatmap for letter ${c.index}`} />
                      <figcaption>
                        #{c.index} · {c.uncertain ? "unsure" : c.label} ({Math.round(c.confidence * 100)}%)
                        {!c.uncertain && c.label === "Reversal" && (
                          <div>Mirrored, it reads as <b>{c.mirrored_label}</b></div>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}

            <p className="scr-note">
              This is a screening aid, not a diagnosis. Letter reversals alone do not
              indicate dyslexia. Please consult a qualified professional for an assessment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}