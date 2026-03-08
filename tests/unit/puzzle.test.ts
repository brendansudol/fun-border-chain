import { describe, expect, it } from "vitest";

import {
  buildCustomPuzzle,
  generatePuzzle,
  inferDifficultyFromShortestLength,
  parseDifficulty,
  parseTimerSeconds,
  resolveGameFromParams,
} from "@/lib/border-chain/puzzle";
import { DEFAULT_SETTINGS } from "@/lib/border-chain/config";
import { sampleGraph, sampleMeta } from "./fixtures";
import puzzlePool from "@/lib/data/puzzlePool.v1.json";
import type { PuzzlePoolEntry } from "@/lib/border-chain/types";

const pool = puzzlePool as PuzzlePoolEntry[];

describe("puzzle helpers", () => {
  it("generates deterministic seeded puzzles", () => {
    expect(generatePuzzle("alpha", "medium", pool)).toEqual(
      generatePuzzle("alpha", "medium", pool),
    );
  });

  it("builds custom puzzles from explicit endpoints", () => {
    const puzzle = buildCustomPuzzle("SEN", "ETH", sampleGraph, sampleMeta);

    expect(puzzle).not.toBeNull();
    expect(puzzle?.shortestLength).toBe(4);
    expect(puzzle?.difficulty).toBe("medium");
  });

  it("sanitizes query params and preserves custom endpoints", () => {
    const params = new URLSearchParams({
      mode: "custom",
      start: "SEN",
      target: "ETH",
      difficulty: "expert",
      timer: "120",
      shortest: "0",
      hints: "0",
    });

    const resolved = resolveGameFromParams(
      params,
      sampleMeta,
      sampleGraph,
      pool,
      "2026-03-07",
      "fallback",
    );

    expect(resolved.puzzle.mode).toBe("custom");
    expect(resolved.puzzle.start).toBe("SEN");
    expect(resolved.settings.timerSeconds).toBe(120);
    expect(resolved.settings.showShortestPathCount).toBe(false);
    expect(resolved.settings.hintsEnabled).toBe(false);
  });

  it("parses difficulty and timer with defaults", () => {
    expect(parseDifficulty("hard")).toBe("hard");
    expect(parseDifficulty("unknown")).toBe(DEFAULT_SETTINGS.difficulty);
    expect(parseTimerSeconds("60")).toBe(60);
    expect(parseTimerSeconds("15")).toBe(DEFAULT_SETTINGS.timerSeconds);
    expect(inferDifficultyFromShortestLength(8)).toBe("expert");
  });
});
