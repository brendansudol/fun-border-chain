"use client";

import { DEFAULT_SETTINGS } from "@/lib/border-chain/config";
import type { GameSettings } from "@/lib/border-chain/types";

type SettingsPanelProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
};

export default function SettingsPanel({
  settings,
  onChange,
}: SettingsPanelProps) {
  return (
    <section className="bc-panel bc-settings" aria-label="Round settings">
      <div className="bc-panel__header">
        <p className="bc-eyebrow">Round setup</p>
        <h2>Settings</h2>
      </div>

      <div className="bc-settings__grid">
        <label className="bc-field">
          <span>Difficulty</span>
          <select
            value={settings.difficulty}
            onChange={(event) =>
              onChange({ ...settings, difficulty: event.target.value as GameSettings["difficulty"] })
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </label>

        <label className="bc-field">
          <span>Timer</span>
          <select
            value={settings.timerSeconds}
            onChange={(event) =>
              onChange({
                ...settings,
                timerSeconds: Number(event.target.value) as GameSettings["timerSeconds"],
              })
            }
          >
            <option value={60}>60s</option>
            <option value={90}>90s</option>
            <option value={120}>120s</option>
          </select>
        </label>

        <label className="bc-switch">
          <input
            checked={settings.showShortestPathCount}
            onChange={(event) =>
              onChange({
                ...settings,
                showShortestPathCount: event.target.checked,
              })
            }
            type="checkbox"
          />
          <span>Show shortest-path count</span>
        </label>

        <label className="bc-switch">
          <input
            checked={settings.hintsEnabled}
            onChange={(event) =>
              onChange({
                ...settings,
                hintsEnabled: event.target.checked,
              })
            }
            type="checkbox"
          />
          <span>Enable one hint</span>
        </label>
      </div>

      <button
        className="bc-button bc-button--ghost"
        onClick={() => onChange(DEFAULT_SETTINGS)}
        type="button"
      >
        Reset defaults
      </button>
    </section>
  );
}
