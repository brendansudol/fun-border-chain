import { bfsShortestPath } from "@/lib/border-chain/engine";
import type { CountryGraph } from "@/lib/border-chain/types";

export function getHintNextStep(
  current: string,
  target: string,
  graph: CountryGraph,
  visited: Set<string>,
): string | null {
  const blocked = new Set(visited);
  blocked.delete(current);
  blocked.delete(target);

  const path = bfsShortestPath(current, target, graph, blocked);
  return path?.[1] ?? null;
}
