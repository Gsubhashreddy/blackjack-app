import { useState } from 'react';
import {
  DEFAULT_MISSING_CARD_SETTINGS,
  type MissingCardDeckCount,
  type MissingCardSettings,
} from '../domain/missingCardController';

export interface MissingCardSetupProps {
  onStart: (settings: MissingCardSettings) => void;
  onBack: () => void;
}

const DECK_OPTIONS: MissingCardDeckCount[] = [1, 2, 4, 6, 8];

export function MissingCardSetup({ onStart, onBack }: MissingCardSetupProps) {
  const [settings, setSettings] = useState(DEFAULT_MISSING_CARD_SETTINGS);

  return (
    <main className="screen setup-screen">
      <button type="button" className="link-button back-button" onClick={onBack}>
        ← Back
      </button>
      <h1>Missing Card Setup</h1>
      <p className="subtitle">
        One card is hidden. Count every other card, then identify the hidden card&apos;s Hi-Lo value.
      </p>

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
              onClick={() => setSettings((current) => ({ ...current, deckCount }))}
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
          onChange={(event) =>
            setSettings((current) => ({ ...current, speed: Number(event.target.value) }))
          }
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={settings.speed}
        />
      </label>

      <button type="button" className="primary-button" onClick={() => onStart(settings)}>
        Start Missing Card
      </button>
    </main>
  );
}
