"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from "react";

import ChainTrail from "@/components/border-chain/ChainTrail";
import CountryInput from "@/components/border-chain/CountryInput";
import GuessLog from "@/components/border-chain/GuessLog";
import HeaderBar from "@/components/border-chain/HeaderBar";
import ResultsSheet from "@/components/border-chain/ResultsSheet";
import Toast from "@/components/border-chain/Toast";
import WorldMap from "@/components/border-chain/WorldMap";
import { HINT_PULSE_MS, TOAST_DURATION_MS } from "@/lib/border-chain/config";
import { bfsShortestPath, createInitialGameState } from "@/lib/border-chain/engine";
import { getHintNextStep } from "@/lib/border-chain/hints";
import { canonicalizeCountry } from "@/lib/border-chain/input";
import { buildPlayHref, resolveGameFromParams } from "@/lib/border-chain/puzzle";
import { gameReducer } from "@/lib/border-chain/reducer";
import { formatLocalDateSeed, randomSeed } from "@/lib/border-chain/seed";
import {
  addRecentPuzzle,
  markDailyCompleted,
} from "@/lib/border-chain/storage";
import { getCurrentEndpoint, getCountryName } from "@/lib/border-chain/selectors";
import { validateGuess } from "@/lib/border-chain/validation";
import type {
  CountryGraph,
  CountryMeta,
  PuzzlePoolEntry,
  WorldMapData,
} from "@/lib/border-chain/types";

type GameShellProps = {
  graph: CountryGraph;
  mapData: WorldMapData;
  meta: CountryMeta;
  pool: PuzzlePoolEntry[];
};

export default function GameShell({
  graph,
  mapData,
  meta,
  pool,
}: GameShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fallbackSeed] = useState(() => randomSeed());
  const todaySeed = formatLocalDateSeed();

  const resolved = resolveGameFromParams(
    searchParams,
    meta,
    graph,
    pool,
    todaySeed,
    fallbackSeed,
  );
  const solutionPath = bfsShortestPath(
    resolved.puzzle.start,
    resolved.puzzle.target,
    graph,
  );
  const roundKey = resolved.canonicalHref;

  const [state, dispatch] = useReducer(
    gameReducer,
    {
      puzzle: resolved.puzzle,
      settings: resolved.settings,
      solutionPath,
    },
    (initial) =>
      createInitialGameState(
        initial.puzzle,
        initial.settings,
        initial.solutionPath,
        Date.now(),
      ),
  );
  const roundKeyRef = useRef(roundKey);

  useEffect(() => {
    if (roundKeyRef.current === roundKey) {
      return;
    }

    roundKeyRef.current = roundKey;
    dispatch({
      type: "restart",
      puzzle: resolved.puzzle,
      settings: resolved.settings,
      solutionPath,
      atMs: Date.now(),
    });
  }, [resolved.puzzle, resolved.settings, roundKey, solutionPath]);

  useEffect(() => {
    const currentHref = `/play${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (currentHref === roundKey) {
      return;
    }

    router.replace(roundKey);
  }, [roundKey, router, searchParams]);

  useEffect(() => {
    addRecentPuzzle({
      href: roundKey,
      mode: resolved.puzzle.mode,
      seed: resolved.puzzle.seed,
      start: resolved.puzzle.start,
      target: resolved.puzzle.target,
      difficulty: resolved.settings.difficulty,
      timerSeconds: resolved.settings.timerSeconds,
      playedAt: new Date().toISOString(),
    });
  }, [
    resolved.puzzle.mode,
    resolved.puzzle.seed,
    resolved.puzzle.start,
    resolved.puzzle.target,
    resolved.settings.difficulty,
    resolved.settings.timerSeconds,
    roundKey,
  ]);

  useEffect(() => {
    if (resolved.puzzle.mode !== "daily" || state.phase === "playing") {
      return;
    }

    markDailyCompleted(resolved.puzzle.seed, state.phase === "won");
  }, [resolved.puzzle.mode, resolved.puzzle.seed, state.phase]);

  const tickRound = useEffectEvent(() => {
    if (state.phase !== "playing" || state.startedAtMs === null) {
      return;
    }

    const now = Date.now();
    const totalMs = state.settings.timerSeconds * 1000;
    if (now - state.startedAtMs >= totalMs) {
      dispatch({ type: "expire" });
      return;
    }

    dispatch({ type: "tick", nowMs: now });
  });

  useEffect(() => {
    if (state.phase !== "playing") {
      return;
    }

    tickRound();
    const interval = window.setInterval(tickRound, 250);
    return () => window.clearInterval(interval);
  }, [state.phase, state.startedAtMs, state.settings.timerSeconds]);

  useEffect(() => {
    if (!state.toast) {
      return;
    }

    const timeout = window.setTimeout(
      () => dispatch({ type: "dismiss_toast" }),
      TOAST_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [state.toast]);

  useEffect(() => {
    if (!state.activeHintCode) {
      return;
    }

    const timeout = window.setTimeout(
      () => dispatch({ type: "clear_hint" }),
      HINT_PULSE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [state.activeHintCode]);

  function navigateToRound(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function handleUndo() {
    if (state.phase !== "playing" || state.chain.length <= 1) {
      return;
    }

    dispatch({ type: "undo" });
  }

  function handleHint() {
    if (
      state.phase !== "playing" ||
      !state.settings.hintsEnabled ||
      state.hintUsed ||
      !state.puzzle
    ) {
      return;
    }

    const current = getCurrentEndpoint(state);
    if (!current) {
      return;
    }

    const hint = getHintNextStep(current, state.puzzle.target, graph, new Set(state.chain));
    if (!hint) {
      dispatch({ type: "notify", kind: "info", message: "No hint available" });
      return;
    }

    dispatch({ type: "show_hint", code: hint });
  }

  function handleReveal() {
    if (state.phase === "playing") {
      dispatch({ type: "reveal" });
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      dispatch({ type: "notify", kind: "info", message: "Link copied" });
    } catch {
      dispatch({ type: "notify", kind: "error", message: "Could not copy link" });
    }
  }

  const handleGlobalKey = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isTypingTarget =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "SELECT" ||
      target?.isContentEditable;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      handleUndo();
      return;
    }

    if (event.key === "/" && !isTypingTarget) {
      event.preventDefault();
      inputRef.current?.focus();
      return;
    }

    if (isTypingTarget) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case "h":
        event.preventDefault();
        handleHint();
        break;
      case "r":
        event.preventDefault();
        handleReveal();
        break;
      case "n":
        event.preventDefault();
        navigateToRound(
          buildPlayHref({
            mode: "random",
            seed: randomSeed(),
            difficulty: state.settings.difficulty,
            timerSeconds: state.settings.timerSeconds,
            showShortestPathCount: state.settings.showShortestPathCount,
            hintsEnabled: state.settings.hintsEnabled,
          }),
        );
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const currentEndpointName = getCountryName(meta, getCurrentEndpoint(state));

  function handleGuessSubmit(raw: string) {
    const atMs = Date.now();
    const code = canonicalizeCountry(raw, meta);

    if (!code) {
      dispatch({
        type: "reject_guess",
        raw,
        reason: "unknown",
        message: "Unknown country",
        atMs,
      });
      return;
    }

    const result = validateGuess(code, state, graph, meta);
    if (!result.ok) {
      dispatch({
        type: "reject_guess",
        raw,
        reason: result.reason,
        message: result.message,
        atMs,
      });
      return;
    }

    dispatch({ type: "accept_guess", code: result.code, atMs });
  }

  function handleNewRound() {
    navigateToRound(
      buildPlayHref({
        mode: "random",
        seed: randomSeed(),
        difficulty: state.settings.difficulty,
        timerSeconds: state.settings.timerSeconds,
        showShortestPathCount: state.settings.showShortestPathCount,
        hintsEnabled: state.settings.hintsEnabled,
      }),
    );
  }

  function handleReplay() {
    dispatch({
      type: "restart",
      puzzle: resolved.puzzle,
      settings: resolved.settings,
      solutionPath,
      atMs: Date.now(),
    });
    inputRef.current?.focus();
  }

  if (!state.puzzle) {
    return null;
  }

  return (
    <main className="bc-page bc-page--play">
      <div className="bc-shell">
        <HeaderBar
          canHint={
            state.phase === "playing" &&
            state.settings.hintsEnabled &&
            !state.hintUsed
          }
          canUndo={state.phase === "playing" && state.chain.length > 1}
          meta={meta}
          onHint={handleHint}
          onNewRound={handleNewRound}
          onReveal={handleReveal}
          onUndo={handleUndo}
          puzzle={state.puzzle}
          remainingMs={state.remainingMs}
          settings={state.settings}
        />

        <div className="bc-play-layout">
          <WorldMap mapData={mapData} meta={meta} state={state} />

          <div className="bc-console">
            <ChainTrail chain={state.chain} meta={meta} />
            <CountryInput
              currentEndpointName={currentEndpointName}
              disabled={state.phase !== "playing"}
              meta={meta}
              onSubmit={handleGuessSubmit}
              ref={inputRef}
            />
            <GuessLog
              chainLength={state.chain.length}
              guessHistory={state.guessHistory}
            />
          </div>
        </div>

        <Toast toast={state.toast} />
        <ResultsSheet
          meta={meta}
          onCopyLink={handleCopyLink}
          onNewRound={handleNewRound}
          onReplay={handleReplay}
          state={state}
        />
      </div>
    </main>
  );
}
