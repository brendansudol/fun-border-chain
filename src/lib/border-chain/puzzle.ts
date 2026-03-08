import { DEFAULT_SETTINGS, DIFFICULTY_BANDS, DIFFICULTIES, TIMER_OPTIONS } from "@/lib/border-chain/config";
import { bfsShortestPath } from "@/lib/border-chain/engine";
import { hashSeed, randomSeed } from "@/lib/border-chain/seed";
import type {
  CountryGraph,
  CountryMeta,
  Difficulty,
  GameSettings,
  Puzzle,
  PuzzlePoolEntry,
  ResolvedGame,
  TimerSeconds,
} from "@/lib/border-chain/types";

type SearchParamsLike = {
  get(name: string): string | null;
};

export function parseDifficulty(value: string | null | undefined): Difficulty {
  if (value && DIFFICULTIES.includes(value as Difficulty)) {
    return value as Difficulty;
  }

  return DEFAULT_SETTINGS.difficulty;
}

export function parseTimerSeconds(value: string | null | undefined): TimerSeconds {
  const numeric = Number(value);
  if (TIMER_OPTIONS.includes(numeric as TimerSeconds)) {
    return numeric as TimerSeconds;
  }

  return DEFAULT_SETTINGS.timerSeconds;
}

export function parseFlag(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") {
    return true;
  }

  if (value === "0") {
    return false;
  }

  return fallback;
}

export function inferDifficultyFromShortestLength(shortestLength: number): Difficulty {
  for (const [difficulty, band] of Object.entries(DIFFICULTY_BANDS) as Array<
    [Difficulty, { min: number; max: number }]
  >) {
    if (shortestLength >= band.min && shortestLength <= band.max) {
      return difficulty;
    }
  }

  return "expert";
}

export function generatePuzzle(
  seed: string,
  difficulty: Difficulty,
  pool: PuzzlePoolEntry[],
  mode: Puzzle["mode"] = "random",
): Puzzle {
  const subset = pool.filter((entry) => entry.difficulty === difficulty);
  const source = subset.length > 0 ? subset : pool;
  const entry = source[hashSeed(seed) % source.length];

  return {
    id: entry.id,
    mode,
    seed,
    start: entry.start,
    target: entry.target,
    shortestLength: entry.shortestLength,
    difficulty: entry.difficulty,
  };
}

export function buildPlayHref(options: {
  mode: Puzzle["mode"];
  seed?: string;
  difficulty: Difficulty;
  timerSeconds: TimerSeconds;
  start?: string;
  target?: string;
  showShortestPathCount: boolean;
  hintsEnabled: boolean;
}): string {
  const params = new URLSearchParams();

  params.set("mode", options.mode);
  if (options.seed) {
    params.set("seed", options.seed);
  }

  params.set("difficulty", options.difficulty);
  params.set("timer", String(options.timerSeconds));
  if (options.start) {
    params.set("start", options.start);
  }
  if (options.target) {
    params.set("target", options.target);
  }

  params.set("shortest", options.showShortestPathCount ? "1" : "0");
  params.set("hints", options.hintsEnabled ? "1" : "0");

  return `/play?${params.toString()}`;
}

export function buildCustomPuzzle(
  start: string,
  target: string,
  graph: CountryGraph,
  meta: CountryMeta,
): Puzzle | null {
  if (!meta[start]?.playable || !meta[target]?.playable || start === target) {
    return null;
  }

  const shortestPath = bfsShortestPath(start, target, graph);
  if (!shortestPath) {
    return null;
  }

  return {
    id: `custom-${start}-${target}`,
    mode: "custom",
    seed: `${start}-${target}`,
    start,
    target,
    shortestLength: shortestPath.length,
    difficulty: inferDifficultyFromShortestLength(shortestPath.length),
  };
}

export function resolveGameFromParams(
  params: SearchParamsLike,
  meta: CountryMeta,
  graph: CountryGraph,
  pool: PuzzlePoolEntry[],
  dailySeedValue: string,
  fallbackSeed = randomSeed(),
): ResolvedGame {
  const settings: GameSettings = {
    difficulty: parseDifficulty(params.get("difficulty")),
    timerSeconds: parseTimerSeconds(params.get("timer")),
    showShortestPathCount: parseFlag(
      params.get("shortest"),
      DEFAULT_SETTINGS.showShortestPathCount,
    ),
    hintsEnabled: parseFlag(params.get("hints"), DEFAULT_SETTINGS.hintsEnabled),
  };

  const start = params.get("start")?.toUpperCase();
  const target = params.get("target")?.toUpperCase();
  const hasCustom = Boolean(start && target);

  if (hasCustom && start && target) {
    const custom = buildCustomPuzzle(start, target, graph, meta);
    if (custom) {
      return {
        puzzle: custom,
        settings,
        canonicalHref: buildPlayHref({
          mode: "custom",
          seed: custom.seed,
          difficulty: settings.difficulty,
          timerSeconds: settings.timerSeconds,
          start,
          target,
          showShortestPathCount: settings.showShortestPathCount,
          hintsEnabled: settings.hintsEnabled,
        }),
      };
    }
  }

  const mode = params.get("mode") === "daily" ? "daily" : "random";
  const seed =
    params.get("seed")?.trim() || (mode === "daily" ? dailySeedValue : fallbackSeed);
  const puzzle = generatePuzzle(seed, settings.difficulty, pool, mode);

  return {
    puzzle,
    settings,
    canonicalHref: buildPlayHref({
      mode,
      seed,
      difficulty: settings.difficulty,
      timerSeconds: settings.timerSeconds,
      showShortestPathCount: settings.showShortestPathCount,
      hintsEnabled: settings.hintsEnabled,
    }),
  };
}
