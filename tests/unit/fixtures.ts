import { DEFAULT_SETTINGS } from "@/lib/border-chain/config";
import { createInitialGameState } from "@/lib/border-chain/engine";
import type { CountryGraph, CountryMeta, Puzzle } from "@/lib/border-chain/types";

export const sampleMeta: CountryMeta = {
  ETH: {
    code: "ETH",
    name: "Ethiopia",
    aliases: ["Ethiopia"],
    region: "Africa",
    playable: true,
    degree: 1,
  },
  ISL: {
    code: "ISL",
    name: "Iceland",
    aliases: ["Iceland"],
    region: "Europe",
    playable: false,
    degree: 0,
  },
  MLI: {
    code: "MLI",
    name: "Mali",
    aliases: ["Mali"],
    region: "Africa",
    playable: true,
    degree: 2,
  },
  NER: {
    code: "NER",
    name: "Niger",
    aliases: ["Niger"],
    region: "Africa",
    playable: true,
    degree: 2,
  },
  SEN: {
    code: "SEN",
    name: "Senegal",
    aliases: ["Senegal"],
    region: "Africa",
    playable: true,
    degree: 1,
  },
};

export const sampleGraph: CountryGraph = {
  version: "test",
  nodes: {
    ETH: { neighbors: ["NER"] },
    MLI: { neighbors: ["SEN", "NER"] },
    NER: { neighbors: ["MLI", "ETH"] },
    SEN: { neighbors: ["MLI"] },
  },
};

export const samplePuzzle: Puzzle = {
  id: "SEN-ETH",
  mode: "custom",
  seed: "SEN-ETH",
  start: "SEN",
  target: "ETH",
  shortestLength: 4,
  difficulty: "medium",
};

export function createSampleState() {
  return createInitialGameState(
    samplePuzzle,
    DEFAULT_SETTINGS,
    ["SEN", "MLI", "NER", "ETH"],
    1_000,
  );
}
