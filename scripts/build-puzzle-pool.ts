import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { bfsShortestPath } from "../src/lib/border-chain/engine";
import { inferDifficultyFromShortestLength } from "../src/lib/border-chain/puzzle";
import type {
  CountryGraph,
  CountryMeta,
  PuzzlePoolEntry,
} from "../src/lib/border-chain/types";

const ROOT = process.cwd();
const META_PATH = path.join(ROOT, "src", "lib", "data", "countryMeta.json");
const GRAPH_PATH = path.join(ROOT, "src", "lib", "data", "countryGraph.json");
const OUTPUT_PATH = path.join(ROOT, "src", "lib", "data", "puzzlePool.v1.json");

async function main() {
  const meta = JSON.parse(await readFile(META_PATH, "utf8")) as CountryMeta;
  const graph = JSON.parse(await readFile(GRAPH_PATH, "utf8")) as CountryGraph;

  const playable = Object.values(meta)
    .filter((entry) => entry.playable)
    .sort((left, right) => left.code.localeCompare(right.code));
  const pool: PuzzlePoolEntry[] = [];

  for (let leftIndex = 0; leftIndex < playable.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < playable.length; rightIndex += 1) {
      const start = playable[leftIndex];
      const target = playable[rightIndex];
      const pathToTarget = bfsShortestPath(start.code, target.code, graph);
      if (!pathToTarget) {
        continue;
      }

      pool.push({
        id: `${start.code}-${target.code}`,
        start: start.code,
        target: target.code,
        shortestLength: pathToTarget.length,
        difficulty: inferDifficultyFromShortestLength(pathToTarget.length),
        sameRegion: start.region === target.region,
        endpointDegrees: [start.degree ?? 0, target.degree ?? 0],
      });
    }
  }

  pool.sort((left, right) => {
    if (left.shortestLength !== right.shortestLength) {
      return left.shortestLength - right.shortestLength;
    }

    return left.id.localeCompare(right.id);
  });

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(pool, null, 2)}\n`, "utf8");

  console.log(`Wrote ${pool.length} puzzle entries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
