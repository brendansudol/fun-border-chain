"use client";

import { getInvalidGuessCount } from "@/lib/border-chain/selectors";
import type { CountryMeta, GameState } from "@/lib/border-chain/types";

type ResultsSheetProps = {
  meta: CountryMeta;
  state: GameState;
  onCopyLink: () => void;
  onNewRound: () => void;
  onReplay: () => void;
};

function formatPath(meta: CountryMeta, codes: string[]) {
  return codes.map((code) => meta[code]?.name ?? code).join(" → ");
}

export default function ResultsSheet({
  meta,
  state,
  onCopyLink,
  onNewRound,
  onReplay,
}: ResultsSheetProps) {
  if (!state.puzzle || state.phase === "playing") {
    return null;
  }

  const headline =
    state.phase === "won"
      ? "Round complete"
      : state.phase === "lost"
        ? "Time expired"
        : "Solution revealed";
  const shortestLength = state.solutionPath?.length ?? state.puzzle.shortestLength;
  const invalidGuessCount = getInvalidGuessCount(state);
  const timeUsedSeconds = Math.round(
    state.settings.timerSeconds - state.remainingMs / 1000,
  );
  const summary =
    state.phase === "won"
      ? `You solved it in ${state.chain.length}; shortest was ${shortestLength}.`
      : `Your path reached ${state.chain.length}; shortest was ${shortestLength}.`;

  return (
    <section
      aria-label="Round results"
      aria-modal="true"
      className="bc-results"
      role="dialog"
    >
      <div className="bc-results__card">
        <p className="bc-eyebrow">Results</p>
        <h2>{headline}</h2>
        <p className="bc-results__summary">{summary}</p>

        <dl className="bc-results__stats">
          <div>
            <dt>Team path</dt>
            <dd>{formatPath(meta, state.chain)}</dd>
          </div>
          <div>
            <dt>Shortest path</dt>
            <dd>
              {state.solutionPath ? formatPath(meta, state.solutionPath) : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Time used</dt>
            <dd>{timeUsedSeconds}s</dd>
          </div>
          <div>
            <dt>Invalid guesses</dt>
            <dd>{invalidGuessCount}</dd>
          </div>
          <div>
            <dt>Hint used</dt>
            <dd>{state.hintUsed ? "Yes" : "No"}</dd>
          </div>
        </dl>

        <div className="bc-inline-actions">
          <button
            className="bc-button bc-button--primary"
            onClick={onNewRound}
            type="button"
          >
            New random round
          </button>
          <button
            className="bc-button bc-button--secondary"
            onClick={onReplay}
            type="button"
          >
            Replay same puzzle
          </button>
          <button
            className="bc-button bc-button--ghost"
            onClick={onCopyLink}
            type="button"
          >
            Copy link
          </button>
        </div>
      </div>
    </section>
  );
}
