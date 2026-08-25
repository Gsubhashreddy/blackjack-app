import { useEffect } from 'react';
import { PlayingCard } from '../components/PlayingCard';
import type { HiLoGuess, MissingCardResult, MissingCardSettings } from '../domain/missingCardController';
import { useMissingCardController } from '../hooks/useMissingCardController';

export interface MissingCardPracticeProps {
  settings: MissingCardSettings;
  onEnd: (result: MissingCardResult) => void;
}

const GUESS_OPTIONS: { value: HiLoGuess; label: string; description: string }[] = [
  { value: 1, label: '+1', description: 'Low card (2–6)' },
  { value: 0, label: '0', description: 'Neutral card (7–9)' },
  { value: -1, label: '−1', description: 'High card (10–Ace)' },
];

export function MissingCardPractice({ settings, onEnd }: MissingCardPracticeProps) {
  const { snapshot, controller } = useMissingCardController(settings);

  useEffect(() => {
    if (snapshot?.phase === 'result' && snapshot.result) {
      onEnd(snapshot.result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.phase]);

  if (!snapshot) {
    return (
      <main className="screen practice-screen">
        <p>Loading…</p>
      </main>
    );
  }

  if (snapshot.phase === 'result') return null;

  const isPaused = snapshot.phase === 'paused';
  const isGuessing = snapshot.phase === 'guessing';

  return (
    <main className="screen practice-screen">
      <h1>Missing Card</h1>
      <div className="session-progress" aria-live="polite">
        <span>
          Cards dealt: {snapshot.cardsDealt} / {snapshot.cardsToDeal}
        </span>
        <span>{Math.round(snapshot.progress * 100)}%</span>
      </div>

      <div className="missing-card-table">
        <div className="missing-card-slot">
          <span>Hidden card</span>
          <PlayingCard faceUp={false} />
        </div>
        <div className="missing-card-slot current-card-slot">
          <span>Current card</span>
          {isPaused ? (
            <p role="status">Session paused</p>
          ) : snapshot.currentCard ? (
            <PlayingCard rank={snapshot.currentCard.rank} suit={snapshot.currentCard.suit} faceUp />
          ) : (
            <p>All visible cards dealt</p>
          )}
        </div>
      </div>

      {isGuessing ? (
        <section className="missing-card-guess" aria-labelledby="missing-card-guess-title">
          <h2 id="missing-card-guess-title">What is the hidden card&apos;s Hi-Lo value?</h2>
          <div className="guess-options">
            {GUESS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="secondary-button"
                aria-label={`${option.description}: ${option.label}`}
                onClick={() => controller.submitGuess(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="table-controls">
          <button
            type="button"
            className="secondary-button"
            onClick={() => (isPaused ? controller.resume() : controller.pause())}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="danger-button" onClick={() => controller.endSession()}>
            End Session
          </button>
        </div>
      )}
    </main>
  );
}
