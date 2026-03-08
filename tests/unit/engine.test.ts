import { describe, expect, it } from "vitest";

import {
  applyValidGuess,
  bfsShortestPath,
  undoLastValidGuess,
} from "@/lib/border-chain/engine";
import { createSampleState, sampleGraph } from "./fixtures";

describe("engine", () => {
  it("finds a shortest path through the graph", () => {
    expect(bfsShortestPath("SEN", "ETH", sampleGraph)).toEqual([
      "SEN",
      "MLI",
      "NER",
      "ETH",
    ]);
  });

  it("applies a valid guess and marks the round won at the target", () => {
    const state = createSampleState();
    const afterMali = applyValidGuess(state, "MLI", 1_500);
    const afterNiger = applyValidGuess(afterMali, "NER", 2_000);
    const afterTarget = applyValidGuess(afterNiger, "ETH", 2_500);

    expect(afterTarget.phase).toBe("won");
    expect(afterTarget.chain).toEqual(["SEN", "MLI", "NER", "ETH"]);
  });

  it("undoes the most recent valid guess only", () => {
    const state = createSampleState();
    const afterMali = applyValidGuess(state, "MLI", 1_500);
    const afterNiger = applyValidGuess(afterMali, "NER", 2_000);
    const undone = undoLastValidGuess(afterNiger);

    expect(undone.chain).toEqual(["SEN", "MLI"]);
    expect(undone.phase).toBe("playing");
  });
});
