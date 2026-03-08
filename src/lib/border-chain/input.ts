import { MAX_AUTOCOMPLETE_RESULTS } from "@/lib/border-chain/config";
import type {
  CountryMeta,
  CountrySuggestion,
} from "@/lib/border-chain/types";

const aliasCache = new WeakMap<CountryMeta, Map<string, string>>();
const suggestionCache = new WeakMap<
  CountryMeta,
  Array<{ code: string; name: string; aliases: string[]; playable: boolean }>
>();

export function normalizeInput(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the\s+/, "");
}

export function getAliasIndex(meta: CountryMeta): Map<string, string> {
  const cached = aliasCache.get(meta);
  if (cached) {
    return cached;
  }

  const index = new Map<string, string>();

  for (const entry of Object.values(meta)) {
    const values = [entry.code, entry.name, ...(entry.aliases ?? [])];

    for (const value of values) {
      const normalized = normalizeInput(value);
      if (!normalized || index.has(normalized)) {
        continue;
      }

      index.set(normalized, entry.code);
    }
  }

  aliasCache.set(meta, index);
  return index;
}

export function canonicalizeCountry(raw: string, meta: CountryMeta): string | null {
  if (!raw.trim()) {
    return null;
  }

  return getAliasIndex(meta).get(normalizeInput(raw)) ?? null;
}

function getSuggestionIndex(meta: CountryMeta) {
  const cached = suggestionCache.get(meta);
  if (cached) {
    return cached;
  }

  const entries = Object.values(meta).map((entry) => ({
    code: entry.code,
    name: entry.name,
    aliases: Array.from(new Set(entry.aliases.map(normalizeInput))),
    playable: entry.playable,
  }));

  suggestionCache.set(meta, entries);
  return entries;
}

export function getCountrySuggestions(
  raw: string,
  meta: CountryMeta,
  limit = MAX_AUTOCOMPLETE_RESULTS,
): CountrySuggestion[] {
  const query = normalizeInput(raw);
  if (!query) {
    return [];
  }

  return getSuggestionIndex(meta)
    .map((entry) => {
      const normalizedName = normalizeInput(entry.name);
      let score = Number.POSITIVE_INFINITY;

      if (normalizedName === query || entry.aliases.includes(query)) {
        score = 0;
      } else if (normalizedName.startsWith(query)) {
        score = 1;
      } else if (entry.aliases.some((alias) => alias.startsWith(query))) {
        score = 2;
      } else if (normalizedName.includes(query)) {
        score = 3;
      } else if (entry.aliases.some((alias) => alias.includes(query))) {
        score = 4;
      }

      return { ...entry, score };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      if (left.playable !== right.playable) {
        return left.playable ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit)
    .map(({ code, name, playable }) => ({ code, name, playable }));
}
