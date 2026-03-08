"use client";

import type { CountrySuggestion } from "@/lib/border-chain/types";

type AutocompleteListProps = {
  suggestions: CountrySuggestion[];
  highlightedIndex: number;
  onHover: (index: number) => void;
  onSelect: (suggestion: CountrySuggestion) => void;
};

export default function AutocompleteList({
  suggestions,
  highlightedIndex,
  onHover,
  onSelect,
}: AutocompleteListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="bc-autocomplete" role="listbox">
      {suggestions.map((suggestion, index) => (
        <li
          aria-selected={index === highlightedIndex}
          className={index === highlightedIndex ? "is-active" : ""}
          key={suggestion.code}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(suggestion)}
          role="option"
        >
          <span>{suggestion.name}</span>
          {!suggestion.playable ? <small>Not playable</small> : null}
        </li>
      ))}
    </ul>
  );
}
