import { useState } from 'react';
import {
  DEFAULT_COUNT_MATH_SETTINGS,
  type CountMathDisplayMode,
  type CountMathSettings,
  type CountMathTimerSeconds,
  type CountMathTransitionMode,
} from '../domain/countMath';

export interface CountMathSetupProps {
  onStart: (settings: CountMathSettings) => void;
  onBack: () => void;
}

const TRANSITIONS: { value: CountMathTransitionMode; label: string }[] = [
  { value: 'positive-to-negative', label: '+ to −' },
  { value: 'negative-to-positive', label: '− to +' },
  { value: 'mixed', label: 'Mixed' },
];
const DISPLAYS: { value: CountMathDisplayMode; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'values', label: 'Hi-Lo values' },
];
const TIMERS: CountMathTimerSeconds[] = [0, 5, 10, 15];

export function CountMathSetup({ onStart, onBack }: CountMathSetupProps) {
  const [settings, setSettings] = useState(DEFAULT_COUNT_MATH_SETTINGS);

  function update<K extends keyof CountMathSettings>(key: K, value: CountMathSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="screen setup-screen">
      <button type="button" className="link-button back-button" onClick={onBack}>
        ← Back
      </button>
      <h1>Count Math Setup</h1>
      <p className="subtitle">Practice changing direction around zero without losing the count.</p>

      <label className="field">
        <span>Starting count range: −{settings.startingCountRange} to +{settings.startingCountRange}</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.startingCountRange}
          onChange={(event) => update('startingCountRange', Number(event.target.value))}
        />
      </label>

      <label className="field">
        <span>Cards per question: up to {settings.cardCount}</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={settings.cardCount}
          onChange={(event) => update('cardCount', Number(event.target.value))}
        />
      </label>

      <fieldset className="field">
        <legend>Transition practice</legend>
        <div className="segmented">
          {TRANSITIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={settings.transitionMode === option.value}
              className={settings.transitionMode === option.value ? 'segment segment-active' : 'segment'}
              onClick={() => update('transitionMode', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Question display</legend>
        <div className="segmented">
          {DISPLAYS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={settings.displayMode === option.value}
              className={settings.displayMode === option.value ? 'segment segment-active' : 'segment'}
              onClick={() => update('displayMode', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Time per question</legend>
        <div className="segmented">
          {TIMERS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              role="radio"
              aria-checked={settings.timerSeconds === seconds}
              className={settings.timerSeconds === seconds ? 'segment segment-active' : 'segment'}
              onClick={() => update('timerSeconds', seconds)}
            >
              {seconds === 0 ? 'Off' : `${seconds}s`}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field field-toggle">
        <span>Increase from 1 card to the selected maximum</span>
        <input
          type="checkbox"
          checked={settings.progressive}
          onChange={(event) => update('progressive', event.target.checked)}
        />
      </label>

      <button type="button" className="primary-button" onClick={() => onStart(settings)}>
        Start Count Math
      </button>
    </main>
  );
}
