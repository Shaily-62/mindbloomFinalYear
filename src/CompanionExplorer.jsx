import React, { useState, useCallback, useRef } from 'react';
import renFront from './assets/companion/ren-front.png';
import renBack from './assets/companion/ren-back.png';
import renLeft from './assets/companion/ren-left.png';
import renRight from './assets/companion/ren-right.png';

const SPRITES = { front: renFront, back: renBack, left: renLeft, right: renRight };

const LETTERS = [
  { char: 'S', x: 14, y: 72 },
  { char: 'O', x: 32, y: 28 },
  { char: 'U', x: 54, y: 68 },
  { char: 'N', x: 74, y: 24 },
  { char: 'D', x: 88, y: 58 },
];

const STEP = 6;
const MARGIN = 6;
const CATCH_RADIUS = 8;

export default function CompanionExplorer() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [dir, setDir] = useState('front');
  const [walking, setWalking] = useState(false);
  const [collected, setCollected] = useState([]);
  const walkTimeout = useRef(null);

  const move = useCallback((dx, dy, nextDir) => {
    setDir(nextDir);
    setWalking(true);
    clearTimeout(walkTimeout.current);
    walkTimeout.current = setTimeout(() => setWalking(false), 220);

    setPos((prev) => {
      const nx = Math.min(100 - MARGIN, Math.max(MARGIN, prev.x + dx));
      const ny = Math.min(100 - MARGIN, Math.max(MARGIN, prev.y + dy));

      LETTERS.forEach((l) => {
        const dist = Math.hypot(l.x - nx, l.y - ny);
        if (dist < CATCH_RADIUS) {
          setCollected((c) => (c.includes(l.char) ? c : [...c, l.char]));
        }
      });

      return { x: nx, y: ny };
    });
  }, []);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); move(0, -STEP, 'back'); break;
      case 'ArrowDown': e.preventDefault(); move(0, STEP, 'front'); break;
      case 'ArrowLeft': e.preventDefault(); move(-STEP, 0, 'left'); break;
      case 'ArrowRight': e.preventDefault(); move(STEP, 0, 'right'); break;
      default: break;
    }
  };

  const allFound = collected.length === LETTERS.length;

  const resetGame = () => {
    setCollected([]);
    setPos({ x: 50, y: 50 });
  };

  return (
    <section className="companion-section" id="companion">
      <p className="companion-eyebrow">A Taste of the Adventure</p>
      <h2>Help Ren Find Their Voice</h2>
      <p className="companion-intro">
        Ren wandered into the Whispering Woods chasing five scattered
        letters. Use your arrow keys to guide them and spell out{' '}
        <strong>SOUND</strong> — the same kind of sound-matching play
        your child will explore inside MindBloom.
      </p>

      <div className="letter-tracker" aria-hidden="true">
        {LETTERS.map((l) => (
          <span
            key={l.char}
            className={`letter-tracker__tile ${collected.includes(l.char) ? 'found' : ''}`}
          >
            {l.char}
          </span>
        ))}
      </div>

      <div
        className="companion-stage"
        tabIndex={0}
        role="application"
        aria-label="Use the arrow keys to move Ren and collect the letters of SOUND."
        onKeyDown={handleKeyDown}
      >
        {LETTERS.map((l) => (
          <div
            key={l.char}
            className={`stage-letter ${collected.includes(l.char) ? 'collected' : ''}`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
          >
            {l.char}
          </div>
        ))}

        <img
          src={SPRITES[dir]}
          alt=""
          className={`companion-sprite ${walking ? 'walking' : ''}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />

        {allFound && (
          <div className="companion-complete">
            <p>Ren found every sound — just like every child finds reading in their own way.</p>
            <button type="button" onClick={resetGame}>Play again</button>
          </div>
        )}
      </div>

      <div className="companion-pad" aria-hidden="true">
        <button type="button" onClick={() => move(0, -STEP, 'back')} aria-label="Move up">↑</button>
        <div className="companion-pad__row">
          <button type="button" onClick={() => move(-STEP, 0, 'left')} aria-label="Move left">←</button>
          <button type="button" onClick={() => move(0, STEP, 'front')} aria-label="Move down">↓</button>
          <button type="button" onClick={() => move(STEP, 0, 'right')} aria-label="Move right">→</button>
        </div>
      </div>
      <p className="companion-hint">Click the woods, then use your arrow keys — or tap the pad on mobile.</p>
    </section>
  );
}