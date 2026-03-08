import { getCountryName } from "@/lib/border-chain/selectors";
import type {
  CountryGraph,
  CountryMeta,
  GameState,
  ValidationResult,
} from "@/lib/border-chain/types";

export function isAdjacent(a: string, b: string, graph: CountryGraph): boolean {
  return graph.nodes[a]?.neighbors.includes(b) ?? false;
}

export function validateGuess(
  code: string,
  state: GameState,
  graph: CountryGraph,
  meta: CountryMeta,
): ValidationResult {
  if (state.phase !== "playing") {
    return {
      ok: false,
      reason: "already_complete",
      message: "Round already over",
      code,
    };
  }

  const entry = meta[code];
  if (!entry) {
    return { ok: false, reason: "unknown", message: "Unknown country" };
  }

  if (!entry.playable) {
    return {
      ok: false,
      reason: "not_playable",
      message: "Not playable in Border Chain",
      code,
    };
  }

  if (state.chain.includes(code)) {
    return {
      ok: false,
      reason: "duplicate",
      message: "Already used",
      code,
    };
  }

  const current = state.chain[state.chain.length - 1];
  if (!current || !isAdjacent(current, code, graph)) {
    return {
      ok: false,
      reason: "not_adjacent",
      message: `Doesn't border ${getCountryName(meta, current)}`,
      code,
    };
  }

  return { ok: true, code };
}
