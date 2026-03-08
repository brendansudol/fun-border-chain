import { readFile } from "node:fs/promises";
import path from "node:path";

import { DIFFICULTY_BANDS } from "../src/lib/border-chain/config";
import { bfsShortestPath } from "../src/lib/border-chain/engine";
import { normalizeInput } from "../src/lib/border-chain/input";
import type {
  CountryGraph,
  CountryMeta,
  PuzzlePoolEntry,
  WorldMapData,
} from "../src/lib/border-chain/types";

const ROOT = process.cwd();

async function loadJson<T>(...parts: string[]) {
  const targetPath = path.join(ROOT, ...parts);
  return JSON.parse(await readFile(targetPath, "utf8")) as T;
}

async function main() {
  const meta = await loadJson<CountryMeta>("src", "lib", "data", "countryMeta.json");
  const graph = await loadJson<CountryGraph>("src", "lib", "data", "countryGraph.json");
  const pool = await loadJson<PuzzlePoolEntry[]>("src", "lib", "data", "puzzlePool.v1.json");
  const worldMap = await loadJson<WorldMapData>("public", "data", "world-map.v1.json");

  const errors: string[] = [];

  for (const [code, node] of Object.entries(graph.nodes)) {
    if (!meta[code]) {
      errors.push(`Missing meta entry for graph node ${code}`);
    }

    if (node.neighbors.includes(code)) {
      errors.push(`Graph node ${code} has a self-loop`);
    }

    for (const neighbor of node.neighbors) {
      if (!graph.nodes[neighbor]?.neighbors.includes(code)) {
        errors.push(`Graph edge ${code}-${neighbor} is not symmetric`);
      }
    }
  }

  const aliasOwners = new Map<string, string>();
  for (const [code, entry] of Object.entries(meta)) {
    for (const alias of [entry.code, entry.name, ...entry.aliases]) {
      const normalized = normalizeInput(alias);
      if (!normalized) {
        continue;
      }

      const owner = aliasOwners.get(normalized);
      if (owner && owner !== code) {
        errors.push(`Alias collision for "${normalized}" between ${owner} and ${code}`);
        continue;
      }

      aliasOwners.set(normalized, code);
    }
  }

  for (const entry of pool) {
    const path = bfsShortestPath(entry.start, entry.target, graph);
    if (!path) {
      errors.push(`Pool entry ${entry.id} is unsolved`);
      continue;
    }

    if (path.length !== entry.shortestLength) {
      errors.push(`Pool entry ${entry.id} has shortestLength ${entry.shortestLength}, expected ${path.length}`);
    }

    const band = DIFFICULTY_BANDS[entry.difficulty];
    if (entry.shortestLength < band.min || entry.shortestLength > band.max) {
      errors.push(`Pool entry ${entry.id} is outside the ${entry.difficulty} band`);
    }
  }

  for (const code of Object.keys(graph.nodes)) {
    if (!meta[code]?.playable) {
      errors.push(`Playable graph node ${code} is not marked playable in meta`);
    }
  }

  for (const [code] of Object.entries(worldMap.countries)) {
    if (/^[A-Z]{3}$/.test(code) && !meta[code]) {
      errors.push(`Map code ${code} has no matching meta entry`);
    }
  }

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log("Data verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
