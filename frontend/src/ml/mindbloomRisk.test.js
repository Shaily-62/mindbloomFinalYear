import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { predictRisk } from "./mindbloomRisk.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const model = JSON.parse(
  readFileSync(join(__dirname, "mindbloom_dyslexia_model.json"), "utf-8")
);

test("predictRisk matches model test_vectors within 1e-6", () => {
  assert.ok(
    Array.isArray(model.test_vectors) && model.test_vectors.length > 0,
    "Test vectors must be present in the model"
  );

  for (const vector of model.test_vectors) {
    const result = predictRisk(model, vector.input);
    const diff = Math.abs(result.probability - vector.expected_probability);
    assert.ok(
      diff < 1e-6,
      `Expected probability difference < 1e-6 for age ${vector.input.age}. Got |${result.probability} - ${vector.expected_probability}| = ${diff}`
    );
    if (vector.expected_band) {
      assert.equal(
        result.band,
        vector.expected_band,
        `Expected band '${vector.expected_band}' for age ${vector.input.age}, got '${result.band}'`
      );
    }
  }
});

test("predictRisk correctly categorizes Low, Elevated, and High risk gameplay", () => {
  // 1. Clean/Flawless play -> Low risk (Typical range)
  const cleanPlay = predictRisk(model, {
    age: 8,
    game1: { hits: 3, clicks: 3, misses: 0 },
    game2: { hits: 6, clicks: 6, misses: 0 },
  });
  assert.equal(cleanPlay.band, "low", "Flawless play must yield low risk");
  assert.ok(cleanPlay.probability < model.screen_threshold, "Flawless play probability must be below screen threshold");

  // 2. Moderate errors / some retries -> Elevated risk (Worth watching)
  const elevatedPlay = predictRisk(model, {
    age: 8,
    game1: { hits: 3, clicks: 5, misses: 2 },
    game2: { hits: 6, clicks: 9, misses: 3 },
  });
  assert.equal(elevatedPlay.band, "elevated", "Moderate errors must yield elevated risk");
  assert.ok(
    elevatedPlay.probability >= model.screen_threshold && elevatedPlay.probability < model.high_threshold,
    "Elevated play probability must be between screen and high thresholds"
  );

  // 3. Frequent errors / many wrong attempts -> High risk (Consider professional screening)
  const highPlay = predictRisk(model, {
    age: 8,
    game1: { hits: 3, clicks: 7, misses: 4 },
    game2: { hits: 6, clicks: 12, misses: 6 },
  });
  assert.equal(highPlay.band, "high", "Heavy error rate must yield high risk");
  assert.ok(highPlay.probability >= model.high_threshold, "High play probability must be above high threshold");
});
