import type { MapPresentation, WorldMapData } from "@/lib/border-chain/types";

const SEAM_THRESHOLD = 40;

type Bounds = [number, number, number, number];

function roundViewBoxValue(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getCountryBounds(mapData: WorldMapData, code: string): Bounds | null {
  const country = mapData.countries[code];
  if (!country) {
    return null;
  }

  if (country.bbox) {
    return country.bbox;
  }

  const point = country.labelPoint;
  return point ? [point[0], point[1], point[0], point[1]] : null;
}

function spansMapSeam(bounds: Bounds, viewBox: WorldMapData["viewBox"]) {
  const [worldMinX, , worldWidth] = viewBox;
  const worldMaxX = worldMinX + worldWidth;

  return (
    bounds[0] <= worldMinX + SEAM_THRESHOLD &&
    bounds[2] >= worldMaxX - SEAM_THRESHOLD
  );
}

function isBounds(value: Bounds | null): value is Bounds {
  return value !== null;
}

export function computeMapViewBox(
  mapData: WorldMapData,
  endpointCodes: Array<string | null | undefined>,
  presentation: MapPresentation,
): WorldMapData["viewBox"] {
  if (!presentation.zoomToEndpoints) {
    return mapData.viewBox;
  }

  const endpointBounds = endpointCodes
    .filter((code): code is string => Boolean(code))
    .map((code) => getCountryBounds(mapData, code))
    .filter(isBounds);

  if (endpointBounds.length === 0) {
    return mapData.viewBox;
  }

  if (endpointBounds.some((bounds) => spansMapSeam(bounds, mapData.viewBox))) {
    return mapData.viewBox;
  }

  const [worldMinX, worldMinY, worldWidth, worldHeight] = mapData.viewBox;
  const aspectRatio = worldWidth / worldHeight;

  const minX = Math.min(...endpointBounds.map((bounds) => bounds[0])) - presentation.endpointPadding;
  const minY = Math.min(...endpointBounds.map((bounds) => bounds[1])) - presentation.endpointPadding;
  const maxX = Math.max(...endpointBounds.map((bounds) => bounds[2])) + presentation.endpointPadding;
  const maxY = Math.max(...endpointBounds.map((bounds) => bounds[3])) + presentation.endpointPadding;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  let width = Math.max(maxX - minX, presentation.minViewportWidth);
  let height = Math.max(maxY - minY, presentation.minViewportHeight);

  if (width / height > aspectRatio) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }

  width = Math.min(width, worldWidth);
  height = Math.min(height, worldHeight);

  const x = clamp(centerX - width / 2, worldMinX, worldMinX + worldWidth - width);
  const y = clamp(centerY - height / 2, worldMinY, worldMinY + worldHeight - height);

  return [
    roundViewBoxValue(x),
    roundViewBoxValue(y),
    roundViewBoxValue(width),
    roundViewBoxValue(height),
  ];
}
