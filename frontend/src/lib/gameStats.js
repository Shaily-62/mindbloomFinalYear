import { supabase } from "./supabase";

/**
 * Upsert a swamp game session row.
 * Keeps ONE row per child and accumulates running totals across sessions.
 *
 * @param {string} childId
 * @param {{ clicks, hits, misses, score, accuracy, missrate }} stats
 */
export async function saveSwampSession(childId, stats) {
  if (!childId) return;

  const { data: existing } = await supabase
    .from("swamp")
    .select("id, clicks, hits, misses, score, accuracy, missrate, days")
    .eq("child_id", childId)
    .maybeSingle();

  if (existing) {
    const totalSessions = (existing.days ?? 0) + 1;
    const { error } = await supabase
      .from("swamp")
      .update({
        clicks:   (existing.clicks   ?? 0) + (stats.clicks   ?? 0),
        hits:     (existing.hits     ?? 0) + (stats.hits     ?? 0),
        misses:   (existing.misses   ?? 0) + (stats.misses   ?? 0),
        score:    (existing.score    ?? 0) + (stats.score    ?? 0),
        accuracy: Math.round(
          ((existing.accuracy ?? 0) * (totalSessions - 1) + (stats.accuracy ?? 0)) / totalSessions
        ),
        missrate: Math.round(
          ((existing.missrate ?? 0) * (totalSessions - 1) + (stats.missrate ?? 0)) / totalSessions
        ),
        days: totalSessions,
      })
      .eq("id", existing.id);

    if (error) console.error("swamp update error:", error.message);
  } else {
    const { error } = await supabase.from("swamp").insert({
      child_id: childId,
      clicks:   stats.clicks   ?? 0,
      hits:     stats.hits     ?? 0,
      misses:   stats.misses   ?? 0,
      score:    stats.score    ?? 0,
      accuracy: stats.accuracy ?? 0,
      missrate: stats.missrate ?? 0,
      days:     1,
    });

    if (error) console.error("swamp insert error:", error.message);
  }
}

/**
 * Upsert a desert game session row.
 * Keeps ONE row per child and accumulates running totals across sessions.
 *
 * @param {string} childId
 * @param {{ clicks, hits, misses, score, accuracy, missrate }} stats
 */
export async function saveDesertSession(childId, stats) {
  if (!childId) return;

  const { data: existing } = await supabase
    .from("desert")
    .select("id, clicks, hits, misses, score, accuracy, missrate, days")
    .eq("child_id", childId)
    .maybeSingle();

  if (existing) {
    const totalSessions = (existing.days ?? 0) + 1;
    const { error } = await supabase
      .from("desert")
      .update({
        clicks:   (existing.clicks   ?? 0) + (stats.clicks   ?? 0),
        hits:     (existing.hits     ?? 0) + (stats.hits     ?? 0),
        misses:   (existing.misses   ?? 0) + (stats.misses   ?? 0),
        score:    (existing.score    ?? 0) + (stats.score    ?? 0),
        accuracy: Math.round(
          ((existing.accuracy ?? 0) * (totalSessions - 1) + (stats.accuracy ?? 0)) / totalSessions
        ),
        missrate: Math.round(
          ((existing.missrate ?? 0) * (totalSessions - 1) + (stats.missrate ?? 0)) / totalSessions
        ),
        days: totalSessions,
      })
      .eq("id", existing.id);

    if (error) console.error("desert update error:", error.message);
  } else {
    const { error } = await supabase.from("desert").insert({
      child_id: childId,
      clicks:   stats.clicks   ?? 0,
      hits:     stats.hits     ?? 0,
      misses:   stats.misses   ?? 0,
      score:    stats.score    ?? 0,
      accuracy: stats.accuracy ?? 0,
      missrate: stats.missrate ?? 0,
      days:     1,
    });

    if (error) console.error("desert insert error:", error.message);
  }
}
