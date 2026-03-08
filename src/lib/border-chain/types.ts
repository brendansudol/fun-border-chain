export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type TimerSeconds = 60 | 90 | 120;
export type Mode = "random" | "daily" | "custom";
export type Phase = "setup" | "playing" | "won" | "lost" | "revealed";

export type InvalidGuessReason =
  | "unknown"
  | "not_playable"
  | "duplicate"
  | "not_adjacent"
  | "already_complete";

export type ToastKind = "success" | "error" | "info";
export type MapStatus =
  | "base"
  | "start"
  | "target"
  | "chain"
  | "current"
  | "hint"
  | "solution";

export type GameSettings = {
  difficulty: Difficulty;
  timerSeconds: TimerSeconds;
  showShortestPathCount: boolean;
  hintsEnabled: boolean;
};

export type Puzzle = {
  id: string;
  mode: Mode;
  seed: string;
  start: string;
  target: string;
  shortestLength: number;
  difficulty: Difficulty;
};

export type PuzzlePoolEntry = {
  id: string;
  start: string;
  target: string;
  shortestLength: number;
  difficulty: Difficulty;
  sameRegion?: boolean;
  endpointDegrees?: [number, number];
  tags?: string[];
};

export type GuessRecord =
  | { kind: "valid"; code: string; atMs: number }
  | { kind: "invalid"; raw: string; reason: InvalidGuessReason; atMs: number };

export type ToastState = {
  kind: ToastKind;
  message: string;
} | null;

export type GameState = {
  phase: Phase;
  puzzle: Puzzle | null;
  settings: GameSettings;
  chain: string[];
  guessHistory: GuessRecord[];
  startedAtMs: number | null;
  elapsedMs: number;
  remainingMs: number;
  hintUsed: boolean;
  activeHintCode: string | null;
  solutionPath: string[] | null;
  toast: ToastState;
};

export type CountryMetaEntry = {
  code: string;
  name: string;
  shortName?: string;
  aliases: string[];
  region: string;
  subregion?: string;
  playable: boolean;
  labelPoint?: [number, number];
  degree?: number;
};

export type CountryMeta = Record<string, CountryMetaEntry>;

export type CountryGraph = {
  version: string;
  nodes: Record<
    string,
    {
      neighbors: string[];
    }
  >;
  edgeTags?: Record<string, string[]>;
};

export type WorldMapCountry = {
  code: string;
  name: string;
  path: string;
  labelPoint: [number, number];
  bbox?: [number, number, number, number];
};

export type WorldMapData = {
  version: string;
  viewBox: [number, number, number, number];
  countries: Record<string, WorldMapCountry>;
};

export type ValidationResult =
  | {
      ok: true;
      code: string;
    }
  | {
      ok: false;
      reason: InvalidGuessReason;
      message: string;
      code?: string;
    };

export type CountrySuggestion = {
  code: string;
  name: string;
  playable: boolean;
};

export type ResolvedGame = {
  puzzle: Puzzle;
  settings: GameSettings;
  canonicalHref: string;
};

export type RecentPuzzleEntry = {
  href: string;
  mode: Mode;
  seed: string;
  start: string;
  target: string;
  difficulty: Difficulty;
  timerSeconds: TimerSeconds;
  playedAt: string;
};
