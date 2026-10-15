import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import model from "./mindbloom_dyslexia_model.json";
import { predictRisk } from "./mindbloomRisk";

/**
 * Hook to compute dyslexia screening risk for a child based on accumulated Game 1 & Game 2 logs.
 *
 * @param {object} child - Child object with at least { id, age }
 * @returns {{
 *   loading: boolean,
 *   result: { probability: number, band: string, contributions: Array, warnings: Array } | null,
 *   hasData: boolean,
 *   error: string | null,
 *   input: { age: number, game1: object, game2: object } | null
 * }}
 */
export function useRiskResult(child) {
  const [state, setState] = useState({
    loading: true,
    result: null,
    hasData: false,
    error: null,
    input: null,
  });

  useEffect(() => {
    let active = true;

    if (!child || !child.id) {
      setState({
        loading: false,
        result: null,
        hasData: false,
        error: null,
        input: null,
      });
      return;
    }

    async function fetchAndScore() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [swampRes, desertRes] = await Promise.all([
          supabase
            .from("swamp")
            .select("clicks, hits, misses")
            .eq("child_id", child.id),
          supabase
            .from("desert")
            .select("clicks, hits, misses")
            .eq("child_id", child.id),
        ]);

        if (swampRes.error) throw swampRes.error;
        if (desertRes.error) throw desertRes.error;

        const game1 = (swampRes.data || []).reduce(
          (acc, row) => ({
            hits: acc.hits + (Number(row.hits) || 0),
            clicks: acc.clicks + (Number(row.clicks) || 0),
            misses: acc.misses + (Number(row.misses) || 0),
          }),
          { hits: 0, clicks: 0, misses: 0 }
        );

        const game2 = (desertRes.data || []).reduce(
          (acc, row) => ({
            hits: acc.hits + (Number(row.hits) || 0),
            clicks: acc.clicks + (Number(row.clicks) || 0),
            misses: acc.misses + (Number(row.misses) || 0),
          }),
          { hits: 0, clicks: 0, misses: 0 }
        );

        // Require activity in both games to produce a valid screening estimate
        const hasData =
          (game1.clicks > 0 || game1.hits > 0) &&
          (game2.clicks > 0 || game2.hits > 0);

        if (!hasData) {
          if (active) {
            setState({
              loading: false,
              result: null,
              hasData: false,
              error: null,
              input: { age: Number(child.age) || 0, game1, game2 },
            });
          }
          return;
        }

        const input = {
          age: Number(child.age) || 0,
          game1,
          game2,
        };

        const result = predictRisk(model, input);

        if (active) {
          setState({
            loading: false,
            result,
            hasData: true,
            error: null,
            input,
          });
        }
      } catch (err) {
        if (active) {
          setState({
            loading: false,
            result: null,
            hasData: false,
            error: err.message || "Failed to calculate screening result",
            input: null,
          });
        }
      }
    }

    fetchAndScore();

    return () => {
      active = false;
    };
  }, [child?.id, child?.age]);

  return state;
}

export default useRiskResult;
