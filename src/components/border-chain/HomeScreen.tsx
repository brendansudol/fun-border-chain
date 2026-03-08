"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import SettingsPanel from "@/components/border-chain/SettingsPanel";
import { DEFAULT_SETTINGS } from "@/lib/border-chain/config";
import { canonicalizeCountry } from "@/lib/border-chain/input";
import {
  buildCustomPuzzle,
  buildPlayHref,
} from "@/lib/border-chain/puzzle";
import { formatLocalDateSeed, randomSeed } from "@/lib/border-chain/seed";
import {
  loadDailyMarker,
  loadLastCustom,
  loadRecentPuzzles,
  loadSettings,
  saveLastCustom,
  saveSettings,
} from "@/lib/border-chain/storage";
import type {
  CountryGraph,
  CountryMeta,
  GameSettings,
  RecentPuzzleEntry,
} from "@/lib/border-chain/types";

type HomeScreenProps = {
  graph: CountryGraph;
  meta: CountryMeta;
};

export default function HomeScreen({ graph, meta }: HomeScreenProps) {
  const router = useRouter();
  const playableCountries = Object.values(meta)
    .filter((entry) => entry.playable)
    .sort((left, right) => left.name.localeCompare(right.name));
  const todaySeed = formatLocalDateSeed();

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [recentPuzzles, setRecentPuzzles] = useState<RecentPuzzleEntry[]>([]);
  const [startInput, setStartInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [customHref, setCustomHref] = useState("");
  const [customError, setCustomError] = useState("");
  const [dailyComplete, setDailyComplete] = useState(false);
  const storageReadyRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSettings(loadSettings());
      setRecentPuzzles(loadRecentPuzzles());

      const lastCustom = loadLastCustom();
      if (lastCustom) {
        setStartInput(meta[lastCustom.start]?.name ?? lastCustom.start);
        setTargetInput(meta[lastCustom.target]?.name ?? lastCustom.target);
      }

      const dailyMarker = loadDailyMarker();
      setDailyComplete(Boolean(dailyMarker[todaySeed]?.won));
      storageReadyRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [meta, todaySeed]);

  useEffect(() => {
    if (!storageReadyRef.current) {
      return;
    }

    saveSettings(settings);
  }, [settings]);

  function navigateTo(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function makeHref(mode: "random" | "daily", seed: string) {
    return buildPlayHref({
      mode,
      seed,
      difficulty: settings.difficulty,
      timerSeconds: settings.timerSeconds,
      showShortestPathCount: settings.showShortestPathCount,
      hintsEnabled: settings.hintsEnabled,
    });
  }

  function handleGenerateCustom() {
    const startCode = canonicalizeCountry(startInput, meta);
    const targetCode = canonicalizeCountry(targetInput, meta);

    if (!startCode || !targetCode) {
      setCustomError("Use valid country names for start and target");
      setCustomHref("");
      return;
    }

    const puzzle = buildCustomPuzzle(startCode, targetCode, graph, meta);
    if (!puzzle) {
      setCustomError("Those countries do not make a playable Border Chain round");
      setCustomHref("");
      return;
    }

    const href = buildPlayHref({
      mode: "custom",
      seed: puzzle.seed,
      difficulty: settings.difficulty,
      timerSeconds: settings.timerSeconds,
      start: puzzle.start,
      target: puzzle.target,
      showShortestPathCount: settings.showShortestPathCount,
      hintsEnabled: settings.hintsEnabled,
    });

    saveLastCustom(startCode, targetCode);
    setCustomError("");
    setCustomHref(href);
  }

  return (
    <main className="bc-page bc-page--home">
      <div className="bc-home">
        <section className="bc-hero">
          <p className="bc-eyebrow">Meeting-end geography game</p>
          <h1>Border Chain</h1>
          <p className="bc-hero__lede">
            Connect the start country to the target by naming countries that share a legal land border with the current endpoint.
          </p>

          <div className="bc-hero__actions">
            <button
              className="bc-button bc-button--primary"
              onClick={() => navigateTo(makeHref("random", randomSeed()))}
              type="button"
            >
              Play Random
            </button>
            <button
              className="bc-button bc-button--secondary"
              onClick={() => navigateTo(makeHref("daily", todaySeed))}
              type="button"
            >
              Play Daily
            </button>
          </div>

          <ul className="bc-rule-list">
            <li>Land borders only</li>
            <li>No repeats</li>
            <li>The host types for the team</li>
          </ul>

          {dailyComplete ? (
            <p className="bc-badge">Today’s daily is already marked complete.</p>
          ) : null}
        </section>

        <div className="bc-home__grid">
          <SettingsPanel settings={settings} onChange={setSettings} />

          <section className="bc-panel">
            <div className="bc-panel__header">
              <p className="bc-eyebrow">Custom puzzle</p>
              <h2>Build a shareable round</h2>
            </div>

            <div className="bc-settings__grid">
              <label className="bc-field">
                <span>Start country</span>
                <input
                  list="bc-country-list"
                  onChange={(event) => setStartInput(event.target.value)}
                  placeholder="Senegal"
                  type="text"
                  value={startInput}
                />
              </label>

              <label className="bc-field">
                <span>Target country</span>
                <input
                  list="bc-country-list"
                  onChange={(event) => setTargetInput(event.target.value)}
                  placeholder="Ethiopia"
                  type="text"
                  value={targetInput}
                />
              </label>
            </div>

            <datalist id="bc-country-list">
              {playableCountries.map((country) => (
                <option key={country.code} value={country.name} />
              ))}
            </datalist>

            <div className="bc-inline-actions">
              <button
                className="bc-button bc-button--secondary"
                onClick={handleGenerateCustom}
                type="button"
              >
                Generate Link
              </button>
              {customHref ? (
                <button
                  className="bc-button bc-button--ghost"
                  onClick={() => navigateTo(customHref)}
                  type="button"
                >
                  Play Custom
                </button>
              ) : null}
            </div>

            {customError ? <p className="bc-inline-error">{customError}</p> : null}
            {customHref ? (
              <div className="bc-link-card">
                <p className="bc-link-card__label">Shareable link</p>
                <code>{customHref}</code>
              </div>
            ) : null}
          </section>

          <section className="bc-panel">
            <div className="bc-panel__header">
              <p className="bc-eyebrow">Recent rounds</p>
              <h2>Jump back in</h2>
            </div>

            {recentPuzzles.length === 0 ? (
              <p className="bc-muted">
                Played rounds are saved locally here after you open them.
              </p>
            ) : (
              <div className="bc-recent-list">
                {recentPuzzles.map((entry) => (
                  <Link className="bc-recent-item" href={entry.href} key={entry.href}>
                    <span>
                      {meta[entry.start]?.name ?? entry.start} to {meta[entry.target]?.name ?? entry.target}
                    </span>
                    <small>
                      {entry.mode} • {entry.difficulty} • {entry.timerSeconds}s
                    </small>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
