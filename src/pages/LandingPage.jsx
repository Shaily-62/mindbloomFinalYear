// LandingPage component (original landing view)
import React from 'react';
import { Link } from 'react-router-dom';
import heroVideo from '../assets/hero-bg.mp4';
import heroPoster from '../assets/hero-poster.png';
import './LandingPage.css';

const SEASONS = [
  { key: 'spring', name: 'Whispering Woods', className: 'spring' },
  { key: 'summer', name: 'Sounding Shores', className: 'summer' },
  { key: 'autumn', name: 'Word Mountains', className: 'autumn' },
  { key: 'winter', name: 'Starry Skies', className: 'winter' },
];

export default function LandingPage() {
  const [activeSeason, setActiveSeason] = React.useState(null);

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="logo">MindBloom</div>
        <nav>
          <a href="#about">About Us</a>
          <Link to="/login" className="login-btn">Login</Link>
        </nav>
      </header>

      <section className="hero-section">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          poster={heroPoster}
          aria-hidden="true"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-blob" aria-hidden="true"></div>

        <div className="hero-content">
          <p className="hero-eyebrow">Early Dyslexia Screening, Reimagined</p>
          <h1>MindBloom</h1>
          <p className="hero-tagline">
            A playful, game-based adventure that helps us understand how
            your child hears, sees, and learns to read.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary">Begin the Journey</button>
            <button type="button" className="btn btn-secondary">Explore the Seasons</button>
          </div>
        </div>
      </section>

      <section className="seasons-section" id="seasons">
        <h2>Explore the Seasons</h2>
        <p className="seasons-intro">
          Each world blends text, sound, images, and handwriting into a
          different kind of challenge — so every child's strengths get a
          chance to shine, while our AI quietly notices the patterns that matter.
        </p>
        <div className="cards-container">
          {SEASONS.map((season, i) => (
            <button
              key={season.key}
              type="button"
              className={`season-card ${season.className} ${activeSeason === i ? 'active' : ''}`}
              onMouseEnter={() => setActiveSeason(i)}
              onMouseLeave={() => setActiveSeason(null)}
              onFocus={() => setActiveSeason(i)}
              onBlur={() => setActiveSeason(null)}
              onClick={() => setActiveSeason(activeSeason === i ? null : i)}
            >
              <h3>{season.name}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* Placeholder for future components like CompanionExplorer */}

      <section className="about-section" id="about">
        <div className="about-content">
          <p className="about-eyebrow">Our Approach</p>
          <h2>About MindBloom</h2>
          <p>
            MindBloom is an AI-powered, game-based screening platform that
            helps identify children who may be at risk of dyslexia — early,
            and without the stress of a conventional test. Instead of a
            clinical assessment, children explore adventures that blend
            text, images, audio, and handwriting into playful challenges.
          </p>
          <p>
            Behind the scenes, AI and natural language processing study how
            each child responds and interacts — adapting the activities in
            real time to their performance, so every session stays engaging
            for the child, clear for parents, and genuinely informative for
            educators.
          </p>
          <p className="about-disclaimer">
            MindBloom provides early screening insights, not a medical diagnosis.
          </p>
          <div className="about-stats">
            <div className="about-stat">
              <span className="about-stat__number">10,000+</span>
              <span className="about-stat__label">Children guided</span>
            </div>
            <div className="about-stat">
              <span className="about-stat__number">4</span>
              <span className="about-stat__label">Seasons of play</span>
            </div>
            <div className="about-stat">
              <span className="about-stat__number">92%</span>
              <span className="about-stat__label">Parents who'd recommend us</span>
            </div>
          </div>
        </div>
        <div className="about-visual" aria-hidden="true"></div>
      </section>
    </div>
  );
}
