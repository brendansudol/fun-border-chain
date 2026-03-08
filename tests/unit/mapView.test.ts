import { describe, expect, it } from "vitest";

import { computeMapViewBox } from "@/lib/border-chain/mapView";
import type { MapPresentation, WorldMapData } from "@/lib/border-chain/types";

const mapData: WorldMapData = {
  version: "test",
  viewBox: [0, 0, 1200, 640],
  countries: {
    AAA: {
      code: "AAA",
      name: "Alpha",
      path: "",
      labelPoint: [150, 150],
      bbox: [100, 100, 200, 200],
    },
    BBB: {
      code: "BBB",
      name: "Beta",
      path: "",
      labelPoint: [330, 170],
      bbox: [300, 120, 360, 220],
    },
    EDGE: {
      code: "EDGE",
      name: "Edge",
      path: "",
      labelPoint: [50, 60],
      bbox: [10, 20, 60, 90],
    },
    SEAM: {
      code: "SEAM",
      name: "Seam",
      path: "",
      labelPoint: [1180, 380],
      bbox: [15, 370, 1185, 390],
    },
  },
};

const presentation: MapPresentation = {
  zoomToEndpoints: true,
  showCountryBorders: false,
  endpointPadding: 20,
  minViewportWidth: 200,
  minViewportHeight: 120,
};

describe("computeMapViewBox", () => {
  it("zooms to the padded bounds of the endpoints", () => {
    expect(computeMapViewBox(mapData, ["AAA", "BBB"], presentation)).toEqual([
      80,
      80,
      300,
      160,
    ]);
  });

  it("clamps the zoomed viewport to the world bounds", () => {
    expect(computeMapViewBox(mapData, ["EDGE"], presentation)).toEqual([
      0,
      0,
      225,
      120,
    ]);
  });

  it("falls back to the full-world view when endpoint zoom is disabled", () => {
    expect(
      computeMapViewBox(mapData, ["AAA", "BBB"], {
        ...presentation,
        zoomToEndpoints: false,
      }),
    ).toEqual(mapData.viewBox);
  });

  it("falls back to the full-world view for seam-crossing countries", () => {
    expect(computeMapViewBox(mapData, ["SEAM"], presentation)).toEqual(
      mapData.viewBox,
    );
  });
});
