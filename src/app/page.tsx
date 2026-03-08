import HomeScreen from "@/components/border-chain/HomeScreen";
import countryGraph from "@/lib/data/countryGraph.json";
import countryMeta from "@/lib/data/countryMeta.json";
import type { CountryGraph, CountryMeta } from "@/lib/border-chain/types";

export default function HomePage() {
  return (
    <HomeScreen
      graph={countryGraph as unknown as CountryGraph}
      meta={countryMeta as unknown as CountryMeta}
    />
  );
}
