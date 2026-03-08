import {
  applyValidGuess,
  createInitialGameState,
  undoLastValidGuess,
} from "@/lib/border-chain/engine";
import type {
  GameSettings,
  GameState,
  InvalidGuessReason,
  Puzzle,
  ToastKind,
} from "@/lib/border-chain/types";

export type GameAction =
  | { type: "tick"; nowMs: number }
  | { type: "accept_guess"; code: string; atMs: number }
  | {
      type: "reject_guess";
      raw: string;
      reason: InvalidGuessReason;
      message: string;
      atMs: number;
    }
  | { type: "undo" }
  | { type: "show_hint"; code: string }
  | { type: "clear_hint" }
  | { type: "reveal" }
  | { type: "expire" }
  | {
      type: "restart";
      puzzle: Puzzle;
      settings: GameSettings;
      solutionPath: string[] | null;
      atMs: number;
    }
  | { type: "notify"; kind: ToastKind; message: string }
  | { type: "dismiss_toast" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "tick": {
      if (state.phase !== "playing" || state.startedAtMs === null) {
        return state;
      }

      const totalMs = state.settings.timerSeconds * 1000;
      const elapsedMs = Math.min(action.nowMs - state.startedAtMs, totalMs);
      const remainingMs = Math.max(totalMs - elapsedMs, 0);

      return {
        ...state,
        elapsedMs,
        remainingMs,
      };
    }

    case "accept_guess":
      return state.phase === "playing"
        ? applyValidGuess(state, action.code, action.atMs)
        : state;

    case "reject_guess":
      return {
        ...state,
        guessHistory: [
          ...state.guessHistory,
          {
            kind: "invalid",
            raw: action.raw,
            reason: action.reason,
            atMs: action.atMs,
          },
        ],
        toast: {
          kind: "error",
          message: action.message,
        },
      };

    case "undo":
      return state.phase === "playing" ? undoLastValidGuess(state) : state;

    case "show_hint":
      return {
        ...state,
        hintUsed: true,
        activeHintCode: action.code,
        toast: { kind: "info", message: "Hint revealed" },
      };

    case "clear_hint":
      return {
        ...state,
        activeHintCode: null,
      };

    case "reveal":
      return {
        ...state,
        phase: "revealed",
        activeHintCode: null,
        toast: { kind: "info", message: "Solution revealed" },
      };

    case "expire":
      return {
        ...state,
        phase: "lost",
        activeHintCode: null,
        remainingMs: 0,
        elapsedMs: state.settings.timerSeconds * 1000,
        toast: { kind: "info", message: "Time expired" },
      };

    case "restart":
      return createInitialGameState(
        action.puzzle,
        action.settings,
        action.solutionPath,
        action.atMs,
      );

    case "notify":
      return {
        ...state,
        toast: {
          kind: action.kind,
          message: action.message,
        },
      };

    case "dismiss_toast":
      return {
        ...state,
        toast: null,
      };

    default:
      return state;
  }
}
