import { useState } from 'react';
import type { DeckCount, RunningCountSettings } from '../domain/session';
import { DEFAULT_SETTINGS } from '../domain/session';

export interface RunningCountSetupProps {
  onStart: (settings: RunningCountSettings) => void;
  onBack: () => void;
}

const DECK_OPTIONS: DeckCount[] = [2, 4, 6, 8];

export function RunningCountSetup({ onStart, onBack }: RunningCountSetupProps) {
  const [settings, setSettings] = useState<RunningCountSettings>(DEFAULT_SETTINGS);

  function update<K extends keyof RunningCountSettings>(key: K, value: RunningCountSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className="screen setup-screen">
      <button type="button" className="link-button back-button" onClick={onBack}>
        ← Back
      </button>
      <h1>Running Count Setup</h1>

      <label className="field">
        <span>Number of simulated seats: {settings.seatCount}</span>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={settings.seatCount}
          onChange={(e) => update('seatCount', Number(e.target.value))}
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={settings.seatCount}
        />
      </label>

      <fieldset className="field">
        <legend>Deck count</legend>
        <div className="segmented" role="radiogroup" aria-label="Deck count">
          {DECK_OPTIONS.map((deckCount) => (
            <button
              key={deckCount}
              type="button"
              role="radio"
              aria-checked={settings.deckCount === deckCount}
              className={settings.deckCount === deckCount ? 'segment segment-active' : 'segment'}
              onClick={() => update('deckCount', deckCount)}
            >
              {deckCount}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Card speed: {settings.speed} (1 = slow, 10 = fast)</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.speed}
          onChange={(e) => update('speed', Number(e.target.value))}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={settings.speed}
        />
      </label>

      <label className="field">
        <span>Ask for running count every {settings.askEveryRounds} round(s)</span>
        <div className="stepper">
          <button
            type="button"
            aria-label="Decrease rounds"
            onClick={() => update('askEveryRounds', Math.max(1, settings.askEveryRounds - 1))}
          >
            −
          </button>
          <span aria-hidden="true">{settings.askEveryRounds}</span>
          <button
            type="button"
            aria-label="Increase rounds"
            onClick={() => update('askEveryRounds', Math.min(10, settings.askEveryRounds + 1))}
          >
            +
          </button>
        </div>
      </label>

      <label className="field field-toggle">
        <span>Show table during count prompt</span>
        <input
          type="checkbox"
          checked={settings.showTableDuringPrompt}
          onChange={(e) => update('showTableDuringPrompt', e.target.checked)}
        />
      </label>

      <button type="button" className="primary-button" onClick={() => onStart(settings)}>
        Start Practice
      </button>
    </main>
  );
}
