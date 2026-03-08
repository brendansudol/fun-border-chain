"use client";

import type { CountryMeta, GameSettings, Puzzle } from "@/lib/border-chain/types";

type HeaderBarProps = {
  meta: CountryMeta;
  puzzle: Puzzle;
  settings: GameSettings;
  remainingMs: number;
  onHint: () => void;
  onNewRound: () => void;
  onReveal: () => void;
  onUndo: () => void;
  canHint: boolean;
  canUndo: boolean;
};

function formatTimer(remainingMs: number): string {
  const totalSeconds = Math.max(Math.ceil(remainingMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function HeaderBar({
  meta,
  puzzle,
  settings,
  remainingMs,
  onHint,
  onNewRound,
  onReveal,
  onUndo,
  canHint,
  canUndo,
}: HeaderBarProps) {
  return (
    <header className="bc-header">
      <div className="bc-header__summary">
        <div className="bc-chip bc-chip--start">
          <span>Start</span>
          <strong>{meta[puzzle.start]?.name ?? puzzle.start}</strong>
        </div>

        <div className="bc-chip bc-chip--target">
          <span>Target</span>
          <strong>{meta[puzzle.target]?.name ?? puzzle.target}</strong>
        </div>

        <div className="bc-stat">
          <span>Timer</span>
          <strong>{formatTimer(remainingMs)}</strong>
        </div>

        <div className="bc-stat">
          <span>Difficulty</span>
          <strong>{puzzle.difficulty}</strong>
        </div>

        {settings.showShortestPathCount ? (
          <div className="bc-stat">
            <span>Shortest</span>
            <strong>{puzzle.shortestLength}</strong>
          </div>
        ) : null}
      </div>

      <div className="bc-header__actions">
        <button
          className="bc-button bc-button--secondary"
          disabled={!canHint}
          onClick={onHint}
          type="button"
        >
          Hint
        </button>
        <button
          className="bc-button bc-button--ghost"
          disabled={!canUndo}
          onClick={onUndo}
          type="button"
        >
          Undo
        </button>
        <button
          className="bc-button bc-button--ghost"
          onClick={onReveal}
          type="button"
        >
          Reveal
        </button>
        <button
          className="bc-button bc-button--ghost"
          onClick={onNewRound}
          type="button"
        >
          New Round
        </button>
      </div>
    </header>
  );
}
