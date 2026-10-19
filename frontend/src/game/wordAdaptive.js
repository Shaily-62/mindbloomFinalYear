// Shared adaptive engine for the swamp (letters) and desert (syllables) games.
// `levels` is any object shaped like { 1: { words: ["cat", ...] }, 2: {...}, ... }.

// ── Default thresholds (override per game via `opts`) ────────
const DEFAULTS = {
  window: 5,           // last N words AT THE CURRENT LEVEL
  levelUpAcc: 0.8,     // first-try accuracy needed to move up
  levelDownAcc: 0.5,   // below this, move down
  fastMs: 8000,        // "quick" response time (null timing = ignored)
  maxReplays: 1.5,     // avg 🔊 replays above this blocks level-up
  minSamples: 2,       // don't change level on too little data
};

const pickWeighted = (items, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
};
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// ── Per-child history, persisted in localStorage ─────────────
// namespace keeps games separate: "wordperf" (swamp, default) | "syllperf" (desert)
export class PerformanceTracker {
  constructor(childId, namespace = "wordperf") {
    this.childId = childId || "guest";
    this.namespace = namespace;
    this.key = `mb_${namespace}_${this.childId}`;
    try { this.history = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { this.history = []; }
  }

  // e: { word, level, attempts, responseMs|null, replays, wrong[], mode, ... }
  record(e) {
    this.history.push({ ...e, firstTry: e.attempts === 1, t: Date.now() });
    this.history = this.history.slice(-200);
    try { localStorage.setItem(this.key, JSON.stringify(this.history)); } catch {}
  }

  recent(n = DEFAULTS.window, level = null) {
    const h = level == null ? this.history : this.history.filter((x) => x.level === level);
    return h.slice(-n);
  }

  stats(level, n = DEFAULTS.window) {
    const r = this.recent(n, level);
    return {
      n: r.length,
      accuracy: r.length ? r.filter((x) => x.firstTry).length / r.length : 1,
      avgAttempts: mean(r.map((x) => x.attempts)) ?? 1,
      avgMs: mean(r.filter((x) => x.responseMs != null).map((x) => x.responseMs)),
      avgReplays: mean(r.map((x) => x.replays || 0)) ?? 0,
    };
  }

  wasMissed(word) { return this.history.some((h) => h.word === word && !h.firstTry); }
}

// ── Method 1: random draw within the level ───────────────────
export class RandomSelector {
  constructor(tracker, levels, startLevel = 1, opts = {}) {
    this.tracker = tracker;
    this.levels = levels;
    this.maxLevel = Object.keys(levels).length;
    this.opts = { ...DEFAULTS, ...opts };
    this.mode = "random";
    this.setLevel(startLevel);
  }

  setLevel(l) { this.level = Math.min(this.maxLevel, Math.max(1, l)); }

  // Level the NEXT word would come from (used for end-of-session screens)
  peekLevel() { return this.level; }

  _pool() {
    const all = this.levels[this.level].words;
    const recent = new Set(this.tracker.recent(3).map((h) => h.word));
    const fresh = all.filter((w) => !recent.has(w));
    return fresh.length ? fresh : all;
  }

  next() {
    const pool = this._pool();
    return { word: pool[Math.floor(Math.random() * pool.length)], level: this.level };
  }
}

// ── Method 2: adaptive agent (rule-based policy) ─────────────
export class AdaptiveSelector extends RandomSelector {
  constructor(tracker, levels, startLevel, opts) {
    super(tracker, levels, startLevel, opts);
    this.mode = "adaptive";

    const completedKey = `mb_${tracker.namespace || "wordperf"}_completed_${tracker.childId || "guest"}`;
    const savedCompleted = localStorage.getItem(completedKey);
    const last = tracker.recent(1)[0];

    if (startLevel && startLevel > 1) {
      this.setLevel(startLevel);
    } else if (savedCompleted !== null) {
      const compLvl = parseInt(savedCompleted, 10);
      if (!isNaN(compLvl)) {
        this.setLevel(compLvl + 1);
      }
    } else if (last && last.level) {
      this.setLevel(last.level + 1);
    } else {
      this.setLevel(startLevel || 1);
    }
  }

  markCompleted() {
    const completedKey = `mb_${this.tracker.namespace || "wordperf"}_completed_${this.tracker.childId || "guest"}`;
    try {
      localStorage.setItem(completedKey, this.level.toString());
    } catch {}
  }

  _decideLevel() {
    const o = this.opts;
    const s = this.tracker.stats(this.level, o.window);
    if (s.n < o.minSamples) return this.level;
    const quick = s.avgMs === null || s.avgMs <= o.fastMs;
    if (s.accuracy >= o.levelUpAcc && quick && s.avgReplays <= o.maxReplays) return this.level + 1;
    if (s.accuracy < o.levelDownAcc || s.avgAttempts > 2) return this.level - 1;
    return this.level;
  }

  peekLevel() {
    return Math.min(this.maxLevel, Math.max(1, this._decideLevel()));
  }

  next() {
    this.setLevel(this._decideLevel());
    const all = this.levels[this.level].words;
    const recent = new Set(this.tracker.recent(3).map((h) => h.word));
    // previously-missed words come back more often; just-seen words are suppressed
    const weights = all.map((w) => {
      let wt = 1;
      if (this.tracker.wasMissed(w)) wt += 2;
      if (recent.has(w)) wt *= 0.1;
      return wt;
    });
    return { word: pickWeighted(all, weights), level: this.level };
  }
}

export const createSelector = (mode, tracker, levels, startLevel = 1, opts = {}) =>
  mode === "random"
    ? new RandomSelector(tracker, levels, startLevel, opts)
    : new AdaptiveSelector(tracker, levels, startLevel, opts);