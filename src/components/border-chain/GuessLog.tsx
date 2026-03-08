"use client";

import type { GuessRecord } from "@/lib/border-chain/types";

type GuessLogProps = {
  chainLength: number;
  guessHistory: GuessRecord[];
};

const REASON_LABELS = {
  unknown: "Unknown country",
  not_playable: "Not playable",
  duplicate: "Already used",
  not_adjacent: "Not adjacent",
  already_complete: "Round over",
} as const;

export default function GuessLog({ chainLength, guessHistory }: GuessLogProps) {
  const invalids = guessHistory
    .filter(
      (
        record,
      ): record is Extract<GuessRecord, { kind: "invalid" }> =>
        record.kind === "invalid",
    )
    .slice(-5)
    .reverse();
  const invalidCount = guessHistory.filter((record) => record.kind === "invalid").length;

  return (
    <section className="bc-panel bc-log">
      <div className="bc-panel__header">
        <p className="bc-eyebrow">Round log</p>
        <h2>
          {chainLength - 1} valid moves • {invalidCount} invalid
        </h2>
      </div>

      {invalids.length === 0 ? (
        <p className="bc-muted">Invalid guesses will appear here.</p>
      ) : (
        <ul className="bc-log__items">
          {invalids.map((record, index) => (
            <li key={`${record.raw}-${record.atMs}-${index}`}>
              <strong>{record.raw}</strong>
              <span>{REASON_LABELS[record.reason]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
