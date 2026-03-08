import type {
  CountryGraph,
  GameSettings,
  GameState,
  Puzzle,
} from "@/lib/border-chain/types";

export function bfsShortestPath(
  start: string,
  target: string,
  graph: CountryGraph,
  blocked = new Set<string>(),
): string[] | null {
  if (start === target) {
    return [start];
  }

  const queue: string[][] = [[start]];
  const visited = new Set<string>([start, ...blocked]);
  visited.delete(start);
  visited.delete(target);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) {
      continue;
    }

    const current = path[path.length - 1];
    const neighbors = graph.nodes[current]?.neighbors ?? [];

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      const nextPath = [...path, neighbor];
      if (neighbor === target) {
        return nextPath;
      }

      visited.add(neighbor);
      queue.push(nextPath);
    }
  }

  return null;
}

export function applyValidGuess(
  state: GameState,
  code: string,
  atMs: number,
): GameState {
  const puzzle = state.puzzle;
  if (!puzzle) {
    return state;
  }

  const chain = [...state.chain, code];
  const guessHistory = [...state.guessHistory, { kind: "valid" as const, code, atMs }];
  const won = code === puzzle.target;

  return {
    ...state,
    chain,
    guessHistory,
    activeHintCode: null,
    phase: won ? "won" : "playing",
    toast: {
      kind: "success",
      message: won ? "Target reached" : "Accepted guess",
    },
  };
}

export function undoLastValidGuess(state: GameState): GameState {
  if (state.chain.length <= 1) {
    return state;
  }

  const guessHistory = [...state.guessHistory];

  while (guessHistory.length > 0) {
    const record = guessHistory.pop();
    if (record?.kind === "valid") {
      return {
        ...state,
        chain: state.chain.slice(0, -1),
        guessHistory,
        activeHintCode: null,
        phase: "playing",
        toast: { kind: "info", message: "Undid last guess" },
      };
    }
  }

  return state;
}

export function createInitialGameState(
  puzzle: Puzzle,
  settings: GameSettings,
  solutionPath: string[] | null,
  startedAtMs = Date.now(),
): GameState {
  return {
    phase: "playing",
    puzzle,
    settings,
    chain: [puzzle.start],
    guessHistory: [],
    startedAtMs,
    elapsedMs: 0,
    remainingMs: settings.timerSeconds * 1000,
    hintUsed: false,
    activeHintCode: null,
    solutionPath,
    toast: null,
  };
}
