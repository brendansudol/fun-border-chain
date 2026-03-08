import { Suspense } from "react";

import GameShell from "@/components/border-chain/GameShell";
import countryGraph from "@/lib/data/countryGraph.json";
import countryMeta from "@/lib/data/countryMeta.json";
import puzzlePool from "@/lib/data/puzzlePool.v1.json";
import worldMap from "../../../public/data/world-map.v1.json";
import type {
  CountryGraph,
  CountryMeta,
  PuzzlePoolEntry,
  WorldMapData,
} from "@/lib/border-chain/types";

function PlayFallback() {
  return (
    <main className="bc-page bc-page--play">
      <div className="bc-shell bc-shell--loading">
        <p className="bc-eyebrow">Border Chain</p>
        <h1 className="bc-loading-title">Preparing the map…</h1>
      </div>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PlayFallback />}>
      <GameShell
        graph={countryGraph as unknown as CountryGraph}
        mapData={worldMap as unknown as WorldMapData}
        meta={countryMeta as unknown as CountryMeta}
        pool={puzzlePool as unknown as PuzzlePoolEntry[]}
      />
    </Suspense>
  );
}
