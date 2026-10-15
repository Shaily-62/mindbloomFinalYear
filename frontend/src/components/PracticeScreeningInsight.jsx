import React from "react";
import { useRiskResult } from "../ml/useRiskResult";
import "./PracticeScreeningInsight.css";

const BAND_CONFIG = {
  low: {
    label: "Typical range",
    className: "psi-badge--low",
  },
  elevated: {
    label: "Worth watching",
    className: "psi-badge--elevated",
  },
  high: {
    label: "Consider a professional screening",
    className: "psi-badge--high",
  },
};

export default function PracticeScreeningInsight({ child }) {
  const { loading, result, hasData, error } = useRiskResult(child);

  if (loading) {
    return (
      <div className="psi-card psi-card--loading">
        <div className="psi-header">
          <span className="psi-icon">🌱</span>
          <h4 className="psi-title">Practice Screening Insight</h4>
        </div>
        <p className="psi-loading-text">Analyzing game patterns…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="psi-card psi-card--error">
        <div className="psi-header">
          <span className="psi-icon">🌱</span>
          <h4 className="psi-title">Practice Screening Insight</h4>
        </div>
        <p className="psi-empty-text">{error}</p>
        <div className="psi-footer">
          Practice-based estimate, not a diagnosis. Talk to a specialist if concerned.
        </div>
      </div>
    );
  }

  if (!hasData || !result) {
    return (
      <div className="psi-card psi-card--nodata">
        <div className="psi-header">
          <span className="psi-icon">🌱</span>
          <h4 className="psi-title">Practice Screening Insight</h4>
        </div>
        <p className="psi-empty-text">Play both games to see insights</p>
        <div className="psi-footer">
          Practice-based estimate, not a diagnosis. Talk to a specialist if concerned.
        </div>
      </div>
    );
  }

  const band = BAND_CONFIG[result.band] || BAND_CONFIG.low;

  // Top 2 contributing factors from calibrated screening model
  const topContributions = (result.contributions || [])
    .slice(0, 2)
    .map((c) => c.label);

  return (
    <div className="psi-card">
      <div className="psi-header">
        <span className="psi-icon">🌱</span>
        <h4 className="psi-title">Practice Screening Insight</h4>
      </div>

      <div className="psi-badge-wrap">
        <span className={`psi-badge ${band.className}`}>{band.label}</span>
      </div>

      {topContributions.length > 0 && (
        <p className="psi-factors">
          Key factors: {topContributions.join(", ")}
        </p>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="psi-warnings">
          {result.warnings.map((w, idx) => (
            <span key={idx} className="psi-warning-item">
              ⚠️ {w}
            </span>
          ))}
        </div>
      )}

      <div className="psi-footer">
        Practice-based estimate, not a diagnosis. Talk to a specialist if concerned.
      </div>
    </div>
  );
}
