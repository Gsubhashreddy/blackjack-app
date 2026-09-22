import { useState } from 'react';
import { DeckEstimationTutorial } from '../components/DeckEstimationTutorial';
import {
  DEFAULT_DECK_ESTIMATION_SETTINGS,
  MAX_DECKS,
  formatDecks,
  type DeckEstimationDifficulty,
  type DeckEstimationSettings,
} from '../domain/deckEstimation';

export interface DeckEstimationSetupProps {
  onStart: (settings: DeckEstimationSettings) => void;
  onBack: () => void;
}

const DIFFICULTIES: { value: DeckEstimationDifficulty; label: string }[] = [
  { value: 'whole', label: 'Whole decks' },
  { value: 'half', label: 'Half decks' },
];

export function DeckEstimationSetup({ onStart, onBack }: DeckEstimationSetupProps) {
  const [settings, setSettings] = useState(DEFAULT_DECK_ESTIMATION_SETTINGS);

  function update<K extends keyof DeckEstimationSettings>(key: K, value: DeckEstimationSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="screen setup-screen">
      <button type="button" className="link-button back-button" onClick={onBack}>
        ← Back
      </button>
      <h1>Deck Estimation Setup</h1>
      <p className="subtitle">
        Judge how many decks sit in the tray. Hover or focus a tray to magnify it, and use the
        arrows to rotate it.
      </p>

      <fieldset className="field">
        <legend>Answer precision</legend>
        <div className="segmented" role="radiogroup" aria-label="Answer precision">
          {DIFFICULTIES.map((option) => (
            <label
              key={option.value}
              className={settings.difficulty === option.value ? 'segment segment-active' : 'segment'}
            >
              <input
                type="radio"
                name="deck-estimation-difficulty"
                value={option.value}
                checked={settings.difficulty === option.value}
                onChange={() => update('difficulty', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Largest tray: {formatDecks(settings.maxDecks)}</span>
        <input
          type="range"
          min={1}
          max={MAX_DECKS}
          step={1}
          value={settings.maxDecks}
          onChange={(event) => update('maxDecks', Number(event.target.value))}
        />
      </label>

      <label className="field field-toggle">
        <span>Show a one-deck reference tray while answering</span>
        <input
          type="checkbox"
          checked={settings.showReference}
          onChange={(event) => update('showReference', event.target.checked)}
        />
      </label>

      <details className="deck-tutorial-details">
        <summary>New to this? Open the tutorial</summary>
        <DeckEstimationTutorial />
      </details>

      <button type="button" className="primary-button" onClick={() => onStart(settings)}>
        Start Deck Estimation
      </button>
    </main>
  );
}
