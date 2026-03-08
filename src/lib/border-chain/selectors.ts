import type {
  CountryMeta,
  GameState,
  MapStatus,
} from "@/lib/border-chain/types";

export function getCurrentEndpoint(state: GameState): string | null {
  return state.chain[state.chain.length - 1] ?? null;
}

export function getCountryName(meta: CountryMeta, code: string | null | undefined): string {
  if (!code) {
    return "";
  }

  return meta[code]?.name ?? code;
}

export function getInvalidGuessCount(state: GameState): number {
  return state.guessHistory.filter((record) => record.kind === "invalid").length;
}

export function getValidMoveCount(state: GameState): number {
  return Math.max(state.chain.length - 1, 0);
}

export function computeMapStatuses(state: GameState): Record<string, MapStatus> {
  const statuses: Record<string, MapStatus> = {};
  const current = getCurrentEndpoint(state);
  const showSolution = state.phase === "lost" || state.phase === "revealed";

  if (showSolution && state.solutionPath) {
    for (const code of state.solutionPath) {
      statuses[code] = "solution";
    }
  }

  for (const code of state.chain) {
    statuses[code] = "chain";
  }

  if (state.puzzle) {
    statuses[state.puzzle.start] = "start";
    statuses[state.puzzle.target] = "target";
  }

  if (state.activeHintCode) {
    statuses[state.activeHintCode] = "hint";
  }

  if (current) {
    statuses[current] = "current";
  }

  return statuses;
}
