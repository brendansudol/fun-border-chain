import {
  DEFAULT_SETTINGS,
  MAX_RECENT_PUZZLES,
  STORAGE_KEYS,
} from "@/lib/border-chain/config";
import type { GameSettings, RecentPuzzleEntry } from "@/lib/border-chain/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSettings(): GameSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...readJson<GameSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  };
}

export function saveSettings(settings: GameSettings) {
  writeJson(STORAGE_KEYS.settings, settings);
}

export function loadRecentPuzzles(): RecentPuzzleEntry[] {
  return readJson<RecentPuzzleEntry[]>(STORAGE_KEYS.recent, []);
}

export function addRecentPuzzle(entry: RecentPuzzleEntry) {
  const current = loadRecentPuzzles().filter((item) => item.href !== entry.href);
  writeJson(STORAGE_KEYS.recent, [entry, ...current].slice(0, MAX_RECENT_PUZZLES));
}

export function loadLastCustom(): { start: string; target: string } | null {
  return readJson<{ start: string; target: string } | null>(
    STORAGE_KEYS.lastCustom,
    null,
  );
}

export function saveLastCustom(start: string, target: string) {
  writeJson(STORAGE_KEYS.lastCustom, { start, target });
}

export function loadDailyMarker(): Record<string, { completedAt: string; won: boolean }> {
  return readJson<Record<string, { completedAt: string; won: boolean }>>(
    STORAGE_KEYS.daily,
    {},
  );
}

export function markDailyCompleted(dateSeed: string, won: boolean) {
  const markers = loadDailyMarker();
  markers[dateSeed] = {
    won,
    completedAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.daily, markers);
}
