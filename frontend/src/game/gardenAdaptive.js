// Adaptive difficulty for the Garden memory game.
// The "level" corresponds to LEVEL_CONFIGS in GardenScene.js (1 to 5).
// Metric: pair accuracy = hits / (hits + misses).

const DEFAULTS = {
  window: 3,         // pool the last N grids played AT THE CURRENT LEVEL
  upAcc: 0.7,        // pooled pair accuracy needed to move up
  downAcc: 0.4,      // below this, move down
  minAttempts: 4,    // need at least this many pooled attempts before changing level
};

export class GardenAdaptive {
  constructor(childId, mode = "adaptive", maxLevel = 5, opts = {}) {
    this.childId = childId || "guest";
    this.key = `mb_gardenperf_${this.childId}`;
    this.completedKey = `mb_gardenperf_completed_${this.childId}`;
    this.mode = mode;
    this.maxLevel = maxLevel;
    this.opts = { ...DEFAULTS, ...opts };
    try { this.history = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { this.history = []; }

    const savedCompleted = localStorage.getItem(this.completedKey);
    const last = this.history[this.history.length - 1];

    if (mode === "adaptive") {
      if (savedCompleted !== null) {
        const comp = parseInt(savedCompleted, 10);
        this.level = !isNaN(comp) ? this._clamp(comp + 1) : 1;
      } else if (last && last.level) {
        this.level = this._clamp(last.level + 1);
      } else {
        this.level = 1;
      }
    } else {
      this.level = 1;
    }
  }

  _clamp(l) { return Math.min(this.maxLevel, Math.max(1, l)); }

  setLevel(l) { this.level = this._clamp(l); }

  // e: { level, pairs, hits, misses, clicks, timeMs|null, previewMs|null }
  record(e) {
    this.history.push({ ...e, mode: this.mode, t: Date.now() });
    this.history = this.history.slice(-100);
    try { localStorage.setItem(this.key, JSON.stringify(this.history)); } catch {}
  }

  _decide() {
    if (this.mode !== "adaptive") return 1;
    const o = this.opts;
    const recent = this.history.filter((h) => h.level === this.level).slice(-o.window);
    const hits = recent.reduce((a, h) => a + h.hits, 0);
    const misses = recent.reduce((a, h) => a + h.misses, 0);
    const attempts = hits + misses;
    if (attempts < o.minAttempts) return this.level;
    const acc = hits / attempts;
    if (acc >= o.upAcc) return this.level + 1;
    if (acc < o.downAcc) return this.level - 1;
    return this.level;
  }

  nextLevel() {
    this.level = this._clamp(this._decide());
    return this.level;
  }

  peekLevel() { return this._clamp(this._decide()); }

  markCompleted() {
    try {
      localStorage.setItem(this.completedKey, this.level.toString());
    } catch {}
  }
}
