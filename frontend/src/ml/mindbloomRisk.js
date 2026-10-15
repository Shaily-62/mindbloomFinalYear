/*
 * MindBloom dyslexia-risk scoring (screening estimate, NOT a diagnosis).
 * Dependency-free. Works with <script src>, Node (require) or a bundler.
 *
 * Usage:
 *   const model = await (await fetch('/mindbloom_dyslexia_model.json')).json();
 *   const r = MindBloomRisk.predictRisk(model, {
 *     age: 9,
 *     game1: { hits: 3, clicks: 3, misses: 0 },   // Game 1 (Swamp Words)
 *     game2: { hits: 6, clicks: 6, misses: 0 },   // Game 2 (Desert Syllables)
 *   });
 *   // r = { probability, band: 'low'|'elevated'|'high', contributions: [...], warnings: [...] }
 */

function buildFeatures(input, model) {
  const age = Number(input.age) || 9;
  const f = { age };

  for (const g of ['game1', 'game2']) {
    const d = input[g] || { hits: 0, clicks: 0, misses: 0 };
    const clicks = Math.max(0, Number(d.clicks) || 0);
    const hits = Math.max(0, Number(d.hits) || 0);
    const misses = Math.max(0, Number(d.misses) || (clicks > hits ? clicks - hits : 0));

    const accuracy = clicks > 0 ? hits / clicks : (hits > 0 ? 1 : 0);
    const errorRate = Math.max(0, 1 - accuracy);
    const missRatio = clicks > 0 ? misses / clicks : 0;

    f[g + '_accuracy'] = accuracy;
    f[g + '_error_rate'] = errorRate;
    f[g + '_miss_ratio'] = missRatio;

    const items = (model && model.game_items) || { game1: 9, game2: 6 };
    const n = d.items || items[g] || 1;
    f[g + '_log_clicks_per_item'] = Math.log1p(clicks / n);
    f[g + '_log_misses_per_item'] = Math.log1p(misses / n);
  }

  return f;
}

function predictRisk(model, input) {
  const f = buildFeatures(input, model);
  const warnings = [];
  if (model.age_range && (f.age < model.age_range[0] || f.age > model.age_range[1])) {
    warnings.push('Age ' + f.age + ' is outside the screening range ' + model.age_range.join('-') + '.');
  }
  let logit = model.intercept;
  const contributions = [];
  model.features.forEach(function (name, i) {
    const z = (f[name] - model.mean[i]) / model.scale[i];
    const c = model.coef[i] * z;
    logit += c;
    contributions.push({ feature: name, label: (model.labels && model.labels[name]) || name, effect: c });
  });
  contributions.sort(function (a, b) { return Math.abs(b.effect) - Math.abs(a.effect); });
  const p = 1 / (1 + Math.exp(-logit));
  const band = p >= model.high_threshold ? 'high' : p >= model.screen_threshold ? 'elevated' : 'low';
  return { probability: p, band: band, contributions: contributions, warnings: warnings };
}

export { buildFeatures, predictRisk };
