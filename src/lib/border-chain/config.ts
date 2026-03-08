import type {
  Difficulty,
  GameSettings,
  MapPresentation,
  TimerSeconds,
} from "@/lib/border-chain/types";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
export const TIMER_OPTIONS: TimerSeconds[] = [60, 90, 120];

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "medium",
  timerSeconds: 90,
  showShortestPathCount: true,
  hintsEnabled: true,
};

export const MAP_PRESENTATION: MapPresentation = {
  zoomToEndpoints: true,
  showCountryBorders: false,
  endpointPadding: 32,
  minViewportWidth: 320,
  minViewportHeight: 180,
};

export const STORAGE_KEYS = {
  settings: "border-chain:settings:v1",
  recent: "border-chain:recent:v1",
  daily: "border-chain:daily:v1",
  lastCustom: "border-chain:last-custom:v1",
} as const;

export const DIFFICULTY_BANDS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 2, max: 3 },
  medium: { min: 4, max: 5 },
  hard: { min: 6, max: 7 },
  expert: { min: 8, max: Number.POSITIVE_INFINITY },
};

export const MAX_AUTOCOMPLETE_RESULTS = 5;
export const MAX_RECENT_PUZZLES = 6;
export const TOAST_DURATION_MS = 1800;
export const HINT_PULSE_MS = 2200;
