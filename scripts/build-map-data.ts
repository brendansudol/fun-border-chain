import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldCountries from "world-countries";
import topoJson from "world-atlas/countries-110m.json";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

import type { WorldMapData } from "../src/lib/border-chain/types";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "public", "data", "world-map.v1.json");
const VIEWBOX: [number, number, number, number] = [0, 0, 1200, 640];

function asFixedNumber(value: number): number {
  return Number(value.toFixed(2));
}

function isFinitePair(point: [number, number]): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

async function main() {
  const topology = topoJson as unknown as Topology;
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection<Geometry>;

  const projection = geoNaturalEarth1().fitExtent(
    [
      [24, 24],
      [VIEWBOX[2] - 24, VIEWBOX[3] - 24],
    ],
    collection,
  );
  const pathBuilder = geoPath(projection);
  const countriesByNumericId = new Map(
    worldCountries.map((country) => [country.ccn3, country]),
  );

  const countryEntries = (collection.features as Feature<Geometry>[]).map((shape, index) => {
    const numericId =
      shape.id === undefined ? null : String(shape.id).padStart(3, "0");
    const country = numericId ? countriesByNumericId.get(numericId) : undefined;
    const code = country?.cca3 ?? `UNMAPPED_${String(index + 1).padStart(3, "0")}`;
    const name =
      country?.name.common ??
      String(shape.properties?.name ?? `Unmapped ${index + 1}`);
    const pathData = pathBuilder(shape);
    if (!pathData) {
      return null;
    }

    const centroid = pathBuilder.centroid(shape) as [number, number];
    const bounds = pathBuilder.bounds(shape);
    const bbox: [number, number, number, number] = [
      asFixedNumber(bounds[0][0]),
      asFixedNumber(bounds[0][1]),
      asFixedNumber(bounds[1][0]),
      asFixedNumber(bounds[1][1]),
    ];
    const labelPoint = isFinitePair(centroid)
      ? [asFixedNumber(centroid[0]), asFixedNumber(centroid[1])]
      : [
          asFixedNumber((bbox[0] + bbox[2]) / 2),
          asFixedNumber((bbox[1] + bbox[3]) / 2),
        ];

    return [
      code,
      {
        code,
        name,
        path: pathData,
        labelPoint: labelPoint as [number, number],
        bbox,
      },
    ] as const;
  });

  const output: WorldMapData = {
    version: "1.0.0",
    viewBox: VIEWBOX,
    countries: Object.fromEntries(
      countryEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    ),
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Wrote ${Object.keys(output.countries).length} map paths to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
