import { describe, expect, it } from "vitest";

import { applyValidGuess } from "@/lib/border-chain/engine";
import { validateGuess } from "@/lib/border-chain/validation";
import { createSampleState, sampleGraph, sampleMeta } from "./fixtures";

describe("validation", () => {
  it("rejects non-playable countries", () => {
    const state = createSampleState();
    expect(validateGuess("ISL", state, sampleGraph, sampleMeta)).toMatchObject({
      ok: false,
      reason: "not_playable",
    });
  });

  it("rejects non-adjacent countries", () => {
    const state = createSampleState();
    expect(validateGuess("ETH", state, sampleGraph, sampleMeta)).toMatchObject({
      ok: false,
      reason: "not_adjacent",
    });
  });

  it("rejects duplicate guesses", () => {
    const state = applyValidGuess(createSampleState(), "MLI", 1_500);
    expect(validateGuess("MLI", state, sampleGraph, sampleMeta)).toMatchObject({
      ok: false,
      reason: "duplicate",
    });
  });

  it("accepts a legal adjacent guess", () => {
    const state = createSampleState();
    expect(validateGuess("MLI", state, sampleGraph, sampleMeta)).toEqual({
      ok: true,
      code: "MLI",
    });
  });
});
