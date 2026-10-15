import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getChildById } from "../lib/children";
import { useRiskResult } from "../ml/useRiskResult";
import ScreeningResult from "../components/ScreeningResult";
import "./ChildProgress.css";

const BAND_DETAILS = {
  low: {
    label: "Typical range",
    badgeClass: "cp-badge--low",
    icon: "🌱",
    summary:
      "Interaction speed and tap activity patterns are consistent with typical age benchmarks.",
    guidance:
      "Your child is navigating word and syllable tasks with confidence. Continue regular practice to build vocabulary and fluency.",
  },
  elevated: {
    label: "Worth watching",
    badgeClass: "cp-badge--elevated",
    icon: "🌾",
    summary:
      "Noticeable variation in tap rhythm or item exploration observed compared to typical baselines.",
    guidance:
      "Keep encouraging daily practice sessions. Observe if certain sound combinations or word lengths take extra time.",
  },
  high: {
    label: "Consider a professional screening",
    badgeClass: "cp-badge--high",
    icon: "🔍",
    summary:
      "Response dynamics and interaction activity differ notably from expected benchmarks.",
    guidance:
      "Consider sharing these game practice observations with an educational specialist or teacher for a comprehensive evaluation.",
  },
};

export default function ChildProgress() {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [child, setChild] = useState(null);
  const [loadingChild, setLoadingChild] = useState(true);
  const [error, setError] = useState(null);
  const [swampStats, setSwampStats] = useState(null);
  const [desertStats, setDesertStats] = useState(null);
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);

  // Screening insight from on-device ML model
  const { loading: loadingRisk, result, hasData } = useRiskResult(child);

  useEffect(() => {
    async function loadData() {
      if (!childId) return;
      setLoadingChild(true);
      setError(null);

      try {
        const childRecord = await getChildById(childId);
        setChild(childRecord);

        // Fetch detailed swamp stats
        const { data: swampData } = await supabase
          .from("swamp")
          .select("*")
          .eq("child_id", childId)
          .maybeSingle();
        setSwampStats(swampData);

        // Fetch detailed desert stats
        const { data: desertData } = await supabase
          .from("desert")
          .select("*")
          .eq("child_id", childId)
          .maybeSingle();
        setDesertStats(desertData);
      } catch (err) {
        console.error("Error loading child progress data:", err);
        setError(err.message || "Failed to load child analysis");
      } finally {
        setLoadingChild(false);
      }
    }

    loadData();
  }, [childId]);

  if (loadingChild) {
    return (
      <div className="cp-loading-screen">
        <div className="cp-spinner">🌱</div>
        <p>Loading child's learning profile & progress analytics…</p>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="cp-error-screen">
        <h2>Child Profile Not Found</h2>
        <p>{error || "Unable to locate this child profile."}</p>
        <button className="cp-back-btn" onClick={() => navigate("/dashboard")}>
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  const bandInfo = result ? (BAND_DETAILS[result.band] || BAND_DETAILS.low) : null;

  // Top 2 contributing factors from screening model
  const filteredContributions = result?.contributions
    ? result.contributions.slice(0, 2)
    : [];

  const totalSessions = (swampStats?.days || 0) + (desertStats?.days || 0);
  const totalHits = (swampStats?.hits || 0) + (desertStats?.hits || 0);
  const totalClicks = (swampStats?.clicks || 0) + (desertStats?.clicks || 0);
  const overallAccuracy =
    totalClicks > 0 ? Math.round((totalHits / totalClicks) * 100) : 0;

  return (
    <div className="cp-container">
      {/* Top bar */}
      <header className="cp-topbar">
        <button className="cp-back-nav-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="cp-breadcrumbs">
          <span>Parent Dashboard</span> / <b>{child.name}'s Analysis</b>
        </div>
        <div className="cp-header-actions">
          {child.handwriting && (
            <button
              className="cp-btn cp-btn--secondary"
              onClick={() => setShowHandwritingModal(true)}
            >
              ✍️ Handwriting Analysis
            </button>
          )}
          <button
            className="cp-btn cp-btn--primary"
            onClick={() => {
              localStorage.setItem("childId", child.id);
              navigate("/game");
            }}
          >
            ▶ Launch Learning Session
          </button>
        </div>
      </header>

      <main className="cp-main">
        {/* Child Profile Card */}
        <section className="cp-profile-card">
          <div className="cp-avatar">{child.name.charAt(0).toUpperCase()}</div>
          <div className="cp-profile-info">
            <h1 className="cp-name">{child.name}</h1>
            <div className="cp-tags">
              <span className="cp-tag">🎂 {child.age ? `${child.age} years old` : "Age not set"}</span>
              {child.grade && <span className="cp-tag">🎒 Grade {child.grade}</span>}
              <span className="cp-tag">🗣️ {child.preferred_language || "English"}</span>
              {child.date_of_birth && (
                <span className="cp-tag">📅 Born: {child.date_of_birth}</span>
              )}
            </div>
          </div>
        </section>

        {/* Top KPIs */}
        <section className="cp-kpi-grid">
          <div className="cp-kpi-card">
            <span className="cp-kpi-label">Total Practice Sessions</span>
            <span className="cp-kpi-value">{totalSessions}</span>
            <span className="cp-kpi-sub">Across all mini-games</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-label">Overall Accuracy</span>
            <span className="cp-kpi-value">{totalClicks > 0 ? `${overallAccuracy}%` : "—"}</span>
            <span className="cp-kpi-sub">{totalHits} correct of {totalClicks} taps</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-label">Game 1 (Swamp Words)</span>
            <span className="cp-kpi-value">{swampStats?.hits || 0}</span>
            <span className="cp-kpi-sub">{swampStats?.days || 0} rounds completed</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-label">Game 2 (Desert Syllables)</span>
            <span className="cp-kpi-value">{desertStats?.hits || 0}</span>
            <span className="cp-kpi-sub">{desertStats?.days || 0} rounds completed</span>
          </div>
        </section>

        {/* Practice Screening Insight Section */}
        <section className="cp-insight-section">
          <div className="cp-section-header">
            <h2 className="cp-section-title">🧠 Practice Screening Insight</h2>
            <span className="cp-section-subtitle">
              On-device behavioral pattern screening based on play interaction dynamics
            </span>
          </div>

          {loadingRisk ? (
            <div className="cp-insight-card cp-insight-card--loading">
              <div className="cp-spinner-small">🌱</div>
              <p>Analyzing practice session logs…</p>
            </div>
          ) : !hasData || !result ? (
            <div className="cp-insight-card cp-insight-card--empty">
              <div className="cp-empty-icon">🎮</div>
              <h3>Play both games to see insights</h3>
              <p>
                To generate a reliable behavioral screening estimate, {child.name} needs to complete at least one round in both <b>Swamp Word Discovery</b> and <b>Desert Syllable Trail</b>.
              </p>
              <button
                className="cp-btn cp-btn--primary"
                onClick={() => {
                  localStorage.setItem("childId", child.id);
                  navigate("/game");
                }}
              >
                ▶ Start First Practice Game
              </button>
              <div className="cp-disclaimer">
                Practice-based estimate, not a diagnosis. Talk to a specialist if concerned.
              </div>
            </div>
          ) : (
            <div className="cp-insight-card">
              {/* Status Band Banner */}
              <div className="cp-status-banner">
                <div className="cp-status-badge-wrap">
                  <span className={`cp-status-badge ${bandInfo.badgeClass}`}>
                    {bandInfo.icon} {bandInfo.label}
                  </span>
                </div>
                <div className="cp-status-text">
                  <h3 className="cp-status-heading">{bandInfo.summary}</h3>
                  <p className="cp-status-desc">{bandInfo.guidance}</p>
                </div>
              </div>

              {/* Contributing Factors Explainability */}
              <div className="cp-explainability">
                <h4 className="cp-explain-title">📊 Key Influencing Factors</h4>
                <p className="cp-explain-intro">
                  The screening model evaluates how your child approaches word recognition tasks:
                </p>

                <div className="cp-factors-list">
                  {filteredContributions.map((c, i) => (
                    <div key={i} className="cp-factor-item">
                      <div className="cp-factor-header">
                        <span className="cp-factor-rank">Factor {i + 1}</span>
                        <span className="cp-factor-label">{c.label}</span>
                      </div>
                      <p className="cp-factor-note">
                        {c.feature === "age"
                          ? `Evaluates responses against typical developmental expectations for age ${child.age}.`
                          : c.feature.includes("game1")
                          ? "Evaluates letter-sound accuracy and word recognition consistency in Swamp Word Discovery."
                          : "Evaluates syllable chunking, order sequencing, and auditory-visual synchronization in Desert Syllable Trail."}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="cp-factors-summary-line">
                  <b>Top factors:</b> {filteredContributions.map((c) => c.label).join(", ")}
                </div>
              </div>

              {/* Warnings if applicable */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="cp-warnings-box">
                  <h4 className="cp-warnings-title">⚠️ Notice & Considerations</h4>
                  {result.warnings.map((w, idx) => (
                    <p key={idx} className="cp-warning-text">• {w}</p>
                  ))}
                </div>
              )}

              {/* Legal & Educational Footer */}
              <div className="cp-disclaimer">
                Practice-based estimate, not a diagnosis. Talk to a specialist if concerned.
              </div>
            </div>
          )}
        </section>

        {/* Detailed Game Breakdown Section */}
        <section className="cp-games-section">
          <h2 className="cp-section-title">🕹️ Detailed Game Activity Breakdown</h2>

          <div className="cp-game-cards-grid">
            {/* Game 1: Swamp */}
            <div className="cp-game-card">
              <div className="cp-game-card-header">
                <span className="cp-game-card-icon">🐊</span>
                <div>
                  <h3 className="cp-game-card-title">Game 1: Swamp Word Discovery</h3>
                  <span className="cp-game-card-subtitle">Letter & Phoneme Formation</span>
                </div>
              </div>

              <div className="cp-game-metrics">
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Sessions Played</span>
                  <span className="cp-metric-val">{swampStats?.days || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Correct Words (Hits)</span>
                  <span className="cp-metric-val cp-metric-val--correct">{swampStats?.hits || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Total Taps (Clicks)</span>
                  <span className="cp-metric-val">{swampStats?.clicks || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Misses / Retries</span>
                  <span className="cp-metric-val cp-metric-val--miss">{swampStats?.misses || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Accuracy</span>
                  <span className="cp-metric-val">
                    {swampStats?.clicks ? `${Math.round((swampStats.hits / swampStats.clicks) * 100)}%` : "—"}
                  </span>
                </div>
              </div>

              <p className="cp-game-skill-note">
                <b>Skills assessed:</b> Missing letter identification, phonological decoding, and motor pacing.
              </p>
            </div>

            {/* Game 2: Desert */}
            <div className="cp-game-card">
              <div className="cp-game-card-header">
                <span className="cp-game-card-icon">🏜️</span>
                <div>
                  <h3 className="cp-game-card-title">Game 2: Desert Syllable Trail</h3>
                  <span className="cp-game-card-subtitle">Syllable Segmentation & Sequencing</span>
                </div>
              </div>

              <div className="cp-game-metrics">
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Sessions Played</span>
                  <span className="cp-metric-val">{desertStats?.days || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Correct Syllables (Hits)</span>
                  <span className="cp-metric-val cp-metric-val--correct">{desertStats?.hits || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Total Taps (Clicks)</span>
                  <span className="cp-metric-val">{desertStats?.clicks || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Misses / Retries</span>
                  <span className="cp-metric-val cp-metric-val--miss">{desertStats?.misses || 0}</span>
                </div>
                <div className="cp-metric-row">
                  <span className="cp-metric-name">Accuracy</span>
                  <span className="cp-metric-val">
                    {desertStats?.clicks ? `${Math.round((desertStats.hits / desertStats.clicks) * 100)}%` : "—"}
                  </span>
                </div>
              </div>

              <p className="cp-game-skill-note">
                <b>Skills assessed:</b> Phonetic chunking, auditory-visual synchronization, and spatial navigation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Handwriting Screening Modal */}
      {showHandwritingModal && child.handwriting && (
        <ScreeningResult child={child} onClose={() => setShowHandwritingModal(false)} />
      )}
    </div>
  );
}
