import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import worldCountries from "world-countries";

import { normalizeInput } from "../src/lib/border-chain/input";
import type {
  CountryGraph,
  CountryMeta,
  WorldMapData,
} from "../src/lib/border-chain/types";

const ROOT = process.cwd();
const MAP_PATH = path.join(ROOT, "public", "data", "world-map.v1.json");
const META_PATH = path.join(ROOT, "src", "lib", "data", "countryMeta.json");
const GRAPH_PATH = path.join(ROOT, "src", "lib", "data", "countryGraph.json");

const MANUAL_ALIASES: Record<string, string[]> = {
  ARE: ["UAE", "United Arab Emirates"],
  BOL: ["Bolivia", "Bolivia Plurinational State of"],
  BRN: ["Brunei", "Brunei Darussalam"],
  COD: [
    "DRC",
    "DR Congo",
    "Democratic Republic of the Congo",
    "Congo Kinshasa",
  ],
  COG: ["Republic of the Congo", "Congo Brazzaville"],
  CPV: ["Cape Verde", "Cabo Verde"],
  CZE: ["Czechia", "Czech Republic"],
  CIV: ["Ivory Coast", "Cote d Ivoire", "Cote dIvoire"],
  GMB: ["Gambia", "The Gambia"],
  GBR: ["UK", "United Kingdom", "Great Britain", "Britain"],
  IRN: ["Iran"],
  KOR: ["South Korea", "Republic of Korea"],
  LAO: ["Laos", "Lao PDR"],
  MKD: ["Macedonia", "North Macedonia"],
  MDA: ["Moldova", "Republic of Moldova"],
  MMR: ["Burma", "Myanmar"],
  PRK: ["North Korea", "DPRK"],
  RUS: ["Russia", "Russian Federation"],
  SWZ: ["Swaziland", "Eswatini"],
  SYR: ["Syria", "Syrian Arab Republic"],
  TZA: ["Tanzania", "United Republic of Tanzania"],
  TLS: ["East Timor", "Timor Leste"],
  TUR: ["Turkey", "Turkiye", "Türkiye"],
  USA: ["US", "U.S.", "U.S.A.", "United States", "United States of America"],
  VEN: ["Venezuela", "Venezuela Bolivarian Republic of"],
  VNM: ["Vietnam", "Viet Nam"],
};

function uniqueAliases(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeInput(trimmed);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(trimmed);
  }

  return result.sort((left, right) => left.localeCompare(right));
}

async function main() {
  const worldMap = JSON.parse(
    await readFile(MAP_PATH, "utf8"),
  ) as WorldMapData;

  const mappedCodes = new Set(
    Object.keys(worldMap.countries).filter((code) => /^[A-Z]{3}$/.test(code)),
  );
  const adjacency = new Map<string, Set<string>>();

  for (const country of worldCountries) {
    if (!mappedCodes.has(country.cca3) || country.cca3 === "ATA") {
      continue;
    }

    for (const neighbor of country.borders ?? []) {
      if (!mappedCodes.has(neighbor) || neighbor === "ATA") {
        continue;
      }

      if (!adjacency.has(country.cca3)) {
        adjacency.set(country.cca3, new Set());
      }

      if (!adjacency.has(neighbor)) {
        adjacency.set(neighbor, new Set());
      }

      adjacency.get(country.cca3)?.add(neighbor);
      adjacency.get(neighbor)?.add(country.cca3);
    }
  }

  const metaEntries = worldCountries
    .slice()
    .sort((left, right) => left.cca3.localeCompare(right.cca3))
    .map((country) => {
      const code = country.cca3;
      const neighbors = Array.from(adjacency.get(code) ?? []).sort();
      const aliases = uniqueAliases([
        code,
        country.name.common,
        country.name.official,
        ...(country.altSpellings ?? []),
        ...(MANUAL_ALIASES[code] ?? []),
      ]);

      return [
        code,
        {
          code,
          name: country.name.common,
          shortName: country.name.common,
          aliases,
          region: country.region || "Other",
          subregion: country.subregion || undefined,
          playable: mappedCodes.has(code) && code !== "ATA" && neighbors.length > 0,
          labelPoint: worldMap.countries[code]?.labelPoint,
          degree: neighbors.length,
        },
      ] as const;
    });

  const graphNodes = Array.from(adjacency.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .filter(([code, neighbors]) => code !== "ATA" && neighbors.size > 0)
    .map(([code, neighbors]) => [
      code,
      {
        neighbors: Array.from(neighbors).sort(),
      },
    ] as const);

  const meta: CountryMeta = Object.fromEntries(metaEntries);
  const graph: CountryGraph = {
    version: "1.0.0",
    nodes: Object.fromEntries(graphNodes),
  };

  await mkdir(path.dirname(META_PATH), { recursive: true });
  await writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  await writeFile(GRAPH_PATH, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

  console.log(`Wrote ${Object.keys(meta).length} countries to ${META_PATH}`);
  console.log(`Wrote ${Object.keys(graph.nodes).length} graph nodes to ${GRAPH_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
