"use client";

import { computeMapStatuses } from "@/lib/border-chain/selectors";
import type {
  CountryMeta,
  GameState,
  WorldMapData,
} from "@/lib/border-chain/types";

type WorldMapProps = {
  mapData: WorldMapData;
  meta: CountryMeta;
  state: GameState;
};

function getMapPoint(mapData: WorldMapData, meta: CountryMeta, code: string) {
  const source = mapData.countries[code];
  if (source?.labelPoint) {
    return source.labelPoint;
  }

  return meta[code]?.labelPoint ?? null;
}

function buildSegments(
  codes: string[],
  mapData: WorldMapData,
  meta: CountryMeta,
) {
  const segments: Array<{ id: string; from: [number, number]; to: [number, number] }> = [];

  for (let index = 0; index < codes.length - 1; index += 1) {
    const from = getMapPoint(mapData, meta, codes[index]);
    const to = getMapPoint(mapData, meta, codes[index + 1]);
    if (!from || !to) {
      continue;
    }

    segments.push({
      id: `${codes[index]}-${codes[index + 1]}-${index}`,
      from,
      to,
    });
  }

  return segments;
}

export default function WorldMap({ mapData, meta, state }: WorldMapProps) {
  const statuses = computeMapStatuses(state);
  const chainSegments = buildSegments(state.chain, mapData, meta);
  const solutionSegments =
    state.phase === "lost" || state.phase === "revealed"
      ? buildSegments(state.solutionPath ?? [], mapData, meta)
      : [];
  const current = state.chain[state.chain.length - 1];
  const currentPoint = current ? getMapPoint(mapData, meta, current) : null;
  const labelCodes = Array.from(
    new Set(
      [state.puzzle?.start, state.puzzle?.target, state.activeHintCode].filter(
        (code): code is string => Boolean(code),
      ),
    ),
  );

  return (
    <section className="bc-panel bc-map-panel">
      <div className="bc-panel__header">
        <p className="bc-eyebrow">World map</p>
        <h2>Light up the route one border at a time</h2>
      </div>

      <div className="bc-map-wrap">
        <svg
          aria-label="World map"
          className="bc-map"
          viewBox={mapData.viewBox.join(" ")}
        >
          <g className="bc-map__countries">
            {Object.values(mapData.countries).map((country) => (
              <path
                className="bc-map__country"
                d={country.path}
                data-state={statuses[country.code] ?? "base"}
                key={country.code}
              />
            ))}
          </g>

          <g className="bc-map__solution">
            {solutionSegments.map((segment, index) => (
              <line
                className="bc-map__line bc-map__line--solution"
                key={segment.id}
                style={{ animationDelay: `${index * 120}ms` }}
                x1={segment.from[0]}
                x2={segment.to[0]}
                y1={segment.from[1]}
                y2={segment.to[1]}
              />
            ))}
          </g>

          <g className="bc-map__chain">
            {chainSegments.map((segment, index) => (
              <line
                className="bc-map__line"
                key={segment.id}
                style={{ animationDelay: `${index * 100}ms` }}
                x1={segment.from[0]}
                x2={segment.to[0]}
                y1={segment.from[1]}
                y2={segment.to[1]}
              />
            ))}
          </g>

          {currentPoint ? (
            <circle
              className="bc-map__endpoint"
              cx={currentPoint[0]}
              cy={currentPoint[1]}
              r="10"
            />
          ) : null}

          <g className="bc-map__labels">
            {labelCodes.map((code) => {
              const point = getMapPoint(mapData, meta, code);
              if (!point) {
                return null;
              }

              return (
                <text
                  className="bc-map__label"
                  key={code}
                  x={point[0] + 12}
                  y={point[1] - 10}
                >
                  {meta[code]?.name ?? code}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </section>
  );
}
