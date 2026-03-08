import { describe, expect, it } from "vitest";

import { canonicalizeCountry, getCountrySuggestions, normalizeInput } from "@/lib/border-chain/input";
import countryMeta from "@/lib/data/countryMeta.json";
import type { CountryMeta } from "@/lib/border-chain/types";

const meta = countryMeta as CountryMeta;

describe("input helpers", () => {
  it("normalizes punctuation, diacritics, and leading articles", () => {
    expect(normalizeInput("  The Côte d’Ivoire  ")).toBe("cote divoire");
  });

  it("canonicalizes common aliases", () => {
    expect(canonicalizeCountry("ivory coast", meta)).toBe("CIV");
    expect(canonicalizeCountry("United States of America", meta)).toBe("USA");
    expect(canonicalizeCountry("south korea", meta)).toBe("KOR");
  });

  it("returns ranked autocomplete suggestions", () => {
    const suggestions = getCountrySuggestions("congo kin", meta);

    expect(suggestions[0]?.code).toBe("COD");
    expect(suggestions[0]?.name).toBe("DR Congo");
  });
});
