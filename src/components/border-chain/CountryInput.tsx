"use client";

import {
  forwardRef,
  useState,
} from "react";

import AutocompleteList from "@/components/border-chain/AutocompleteList";
import { getCountrySuggestions } from "@/lib/border-chain/input";
import type { CountryMeta, CountrySuggestion } from "@/lib/border-chain/types";

type CountryInputProps = {
  meta: CountryMeta;
  disabled: boolean;
  currentEndpointName: string;
  onSubmit: (raw: string) => void;
};

const CountryInput = forwardRef<HTMLInputElement, CountryInputProps>(
  function CountryInput({ meta, disabled, currentEndpointName, onSubmit }, ref) {
    const [value, setValue] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const suggestions = disabled ? [] : getCountrySuggestions(value, meta);

    function submitGuess(nextValue = value) {
      const trimmed = nextValue.trim();
      if (!trimmed) {
        return;
      }

      onSubmit(trimmed);
      setValue("");
      setHighlightedIndex(0);
    }

    function applySuggestion(suggestion: CountrySuggestion) {
      setValue("");
      setHighlightedIndex(0);
      onSubmit(suggestion.name);
    }

    return (
      <section className="bc-panel bc-input-panel">
        <div className="bc-panel__header">
          <p className="bc-eyebrow">Guess</p>
          <h2>Current endpoint: {currentEndpointName}</h2>
        </div>

        <div className="bc-input-wrap">
          <label className="bc-field">
            <span className="sr-only">Country guess</span>
            <input
              autoCapitalize="words"
              autoComplete="off"
              disabled={disabled}
              onChange={(event) => {
                setValue(event.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && suggestions.length > 0) {
                  event.preventDefault();
                  setHighlightedIndex((current) =>
                    Math.min(current + 1, suggestions.length - 1),
                  );
                  return;
                }

                if (event.key === "ArrowUp" && suggestions.length > 0) {
                  event.preventDefault();
                  setHighlightedIndex((current) => Math.max(current - 1, 0));
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  if (suggestions[highlightedIndex]) {
                    applySuggestion(suggestions[highlightedIndex]);
                    return;
                  }

                  submitGuess();
                  return;
                }

                if (event.key === "Escape") {
                  setValue("");
                }
              }}
              placeholder="Type a country…"
              ref={ref}
              type="text"
              value={value}
            />
          </label>

          <button
            className="bc-button bc-button--primary"
            disabled={disabled || !value.trim()}
            onClick={() => submitGuess()}
            type="button"
          >
            Submit
          </button>
        </div>

        <AutocompleteList
          highlightedIndex={highlightedIndex}
          onHover={setHighlightedIndex}
          onSelect={applySuggestion}
          suggestions={suggestions}
        />

        <p className="bc-shortcuts">
          <code>/</code> focus • <code>Enter</code> submit • <code>Esc</code> clear • <code>H</code> hint • <code>Cmd/Ctrl+Z</code> undo
        </p>
      </section>
    );
  },
);

export default CountryInput;
