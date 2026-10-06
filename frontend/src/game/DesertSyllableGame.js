/**
 * DesertSyllableGame.js
 *
 * Manages the Desert Syllable collection mini-game.
 * Each round:  show word → vulture smashes it → syllables scatter →
 * hero collects them in order → word reconstructed → celebrate.
 *
 * Tracking: word, syllable order, accuracy, attempts, response time.
 */
import Phaser from "phaser";
const FONT = "'Quicksand', system-ui, -apple-system, sans-serif";

// ── Word bank with syllable breakdowns ────────────────────────
// Grouped by difficulty tier so adaptive difficulty can promote/demote.
export const SYLLABLE_LEVELS = {
  1: {
    tag: "2-syllable-easy",
    words: [
      { word: "apple",     syllables: ["ap", "ple"] },
      { word: "baby",      syllables: ["ba", "by"] },
      { word: "candy",     syllables: ["can", "dy"] },
      { word: "happy",     syllables: ["hap", "py"] },
      { word: "water",     syllables: ["wa", "ter"] },
      { word: "puppy",     syllables: ["pup", "py"] },
      { word: "kitten",    syllables: ["kit", "ten"] },
      { word: "rabbit",    syllables: ["rab", "bit"] },
      { word: "sunset",    syllables: ["sun", "set"] },
      { word: "basket",    syllables: ["bas", "ket"] },
    ],
  },
  2: {
    tag: "2-syllable-medium",
    words: [
      { word: "tiger",     syllables: ["ti", "ger"] },
      { word: "garden",    syllables: ["gar", "den"] },
      { word: "silver",    syllables: ["sil", "ver"] },
      { word: "chapter",   syllables: ["chap", "ter"] },
      { word: "winter",    syllables: ["win", "ter"] },
      { word: "monster",   syllables: ["mon", "ster"] },
      { word: "market",    syllables: ["mar", "ket"] },
      { word: "pencil",    syllables: ["pen", "cil"] },
    ],
  },
  3: {
    tag: "3-syllable",
    words: [
      { word: "elephant",  syllables: ["el", "e", "phant"] },
      { word: "banana",    syllables: ["ba", "na", "na"] },
      { word: "butterfly", syllables: ["but", "ter", "fly"] },
      { word: "dinosaur",  syllables: ["di", "no", "saur"] },
      { word: "umbrella",  syllables: ["um", "brel", "la"] },
      { word: "computer",  syllables: ["com", "pu", "ter"] },
      { word: "wonderful", syllables: ["won", "der", "ful"] },
      { word: "adventure", syllables: ["ad", "ven", "ture"] },
    ],
  },
  4: {
    tag: "4-syllable",
    words: [
      { word: "caterpillar", syllables: ["cat", "er", "pil", "lar"] },
      { word: "watermelon",  syllables: ["wa", "ter", "mel", "on"] },
      { word: "alligator",   syllables: ["al", "li", "ga", "tor"] },
      { word: "calculator",  syllables: ["cal", "cu", "la", "tor"] },
      { word: "helicopter",  syllables: ["hel", "i", "cop", "ter"] },
      { word: "television",  syllables: ["tel", "e", "vi", "sion"] },
    ],
  },
};

const WORDS_PER_DESERT_ROUND = 3;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)] ?? null;
};

export class DesertSyllableGame {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;
    this.streak = 0;
    this.log = [];          // per-attempt log
    this.rounds = [];       // per-round summary
    this.currentIndex = 0;  // which syllable we're waiting for next
  }

  start(level = 1) {
    this.level = Math.min(Math.max(1, level), Object.keys(SYLLABLE_LEVELS).length);
    this.cfg = SYLLABLE_LEVELS[this.level];
    this.queue = Phaser.Utils.Array.Shuffle([...this.cfg.words]);
    this.rounds = [];
    this.log = [];
    this.currentIndex = 0;
    this.nextRound();
  }

  nextRound() {
    const entry = this.queue.pop();
    if (!entry) {
      this._levelDone();
      return;
    }

    this.round = {
      word: entry.word,
      syllables: entry.syllables,
      collected: [],       // syllables collected so far
      attempts: 0,
      wrongAttempts: 0,
      t0: 0,               // timer starts after vulture animation
      startTime: 0,
    };
    this.currentIndex = 0;

    // Tell the scene to start the visual sequence
    this.scene._startSyllableRound(entry.word, entry.syllables);
  }

  /** Called by scene after vulture animation completes and syllables are scattered */
  onScatterComplete() {
    this.round.t0 = performance.now();
    this.round.startTime = Date.now();
  }

  /** Returns the current expected syllable text */
  getExpectedSyllable() {
    if (!this.round) return null;
    return this.round.syllables[this.currentIndex] ?? null;
  }

  /** Called when hero touches a syllable chip. Returns { correct, done } */
  onCollect(syllableText) {
    if (!this.round) return { correct: false, done: false };

    this.round.attempts++;
    const expected = this.round.syllables[this.currentIndex];
    const correct = syllableText.toLowerCase() === expected.toLowerCase();

    const ms = this.round.t0 ? Math.round(performance.now() - this.round.t0) : null;

    this.log.push({
      ts: Date.now(),
      level: this.level,
      word: this.round.word,
      expected,
      chosen: syllableText,
      correct,
      attempt: this.round.attempts,
      responseMs: ms,
      syllableIndex: this.currentIndex,
    });

    if (correct) {
      this.streak++;
      this.round.collected.push(syllableText);
      this.currentIndex++;

      const done = this.currentIndex >= this.round.syllables.length;
      if (done) {
        this._roundComplete(ms);
      }
      return { correct: true, done };
    } else {
      this.streak = 0;
      this.round.wrongAttempts++;
      return { correct: false, done: false };
    }
  }

  _roundComplete(ms) {
    const r = this.round;
    const firstTry = r.wrongAttempts === 0;
    const pts =
      Math.max(30, 100 - 15 * r.wrongAttempts) +
      (firstTry && ms !== null && ms < 15000 ? 30 : 0) +
      Math.min(this.streak, 5) * 5 +
      r.syllables.length * 10;  // bonus for longer words

    const stars = firstTry ? 3 : r.wrongAttempts <= 2 ? 2 : 1;

    this.rounds.push({
      word: r.word,
      syllables: r.syllables,
      tag: this.cfg.tag,
      attempts: r.attempts,
      wrongAttempts: r.wrongAttempts,
      firstTry,
      responseMs: ms,
      pts,
      stars,
    });

    this.score += pts;
    this.scene._celebrateSyllable(pts, stars, r.word);
  }

  /** After celebration, the scene calls this to proceed */
  afterCelebration() {
    if (this.rounds.length >= WORDS_PER_DESERT_ROUND) {
      this._levelDone();
    } else {
      this.nextRound();
    }
  }

  speak(auto = false) {
    const r = this.round;
    if (!r) return;
    const word = r.word;

    try {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.rate = 0.8;
        u.lang = "en-US";
        speechSynthesis.speak(u);
      }
    } catch (e) {
      // ignore browser audio policy restrictions
    }
  }

  _levelDone() {
    const R = this.rounds;
    const n = R.length || 1;
    const acc = R.filter((x) => x.firstTry).length / n;

    // Send analytics
    try {
      navigator.sendBeacon?.(
        "/api/mindbloom/syllable-game",
        new Blob(
          [
            JSON.stringify({
              level: this.level,
              accuracy: acc,
              medianMs: median(R.map((x) => x.responseMs).filter(Boolean)),
              rounds: R,
              attempts: this.log,
            }),
          ],
          { type: "application/json" }
        )
      );
    } catch (e) {
      // silent
    }

    // Adaptive difficulty
    const next =
      acc >= 0.8
        ? Math.min(Object.keys(SYLLABLE_LEVELS).length, this.level + 1)
        : acc < 0.4
        ? Math.max(1, this.level - 1)
        : this.level;

    this.scene._showLevelComplete(acc, next);
  }

  getScore() {
    return this.score;
  }
}
