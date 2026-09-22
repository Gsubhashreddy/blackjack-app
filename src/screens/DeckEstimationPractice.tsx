import { useState } from 'react';
import { CardTray } from '../components/CardTray';
import { DeckEstimationTutorial } from '../components/DeckEstimationTutorial';
import {
  DECK_STEP,
  MAX_DECKS,
  MIN_DECKS,
  averageDeckError,
  clampDecks,
  createDeckEstimationQuestion,
  createEmptyDeckEstimationStats,
  decksToCards,
  formatDecks,
  gradeDeckEstimation,
  recordDeckEstimation,
  type DeckEstimationGrade,
  type DeckEstimationSettings,
} from '../domain/deckEstimation';

export interface DeckEstimationPracticeProps {
  settings: DeckEstimationSettings;
  onHome: () => void;
}

function accuracy(correct: number, attempted: number): string {
  return attempted === 0 ? '—' : `${Math.round((correct / attempted) * 100)}%`;
}

export function DeckEstimationPractice({ settings, onHome }: DeckEstimationPracticeProps) {
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState(() => createDeckEstimationQuestion(settings));
  const [guess, setGuess] = useState(1);
  const [grade, setGrade] = useState<DeckEstimationGrade | null>(null);
  const [stats, setStats] = useState(createEmptyDeckEstimationStats);
  const [showTutorial, setShowTutorial] = useState(false);

  function submitGuess() {
    if (grade) return;
    const nextGrade = gradeDeckEstimation(guess, question.decks);
    setGrade(nextGrade);
    setStats((current) => recordDeckEstimation(current, nextGrade));
  }

  function nextQuestion() {
    setQuestionNumber((current) => current + 1);
    setQuestion(createDeckEstimationQuestion(settings));
    setGuess(1);
    setGrade(null);
  }

  function adjustGuess(delta: number) {
    setGuess((current) => clampDecks(current + delta));
  }

  return (
    <main className="screen deck-estimation-screen">
      <header className="count-math-header">
        <div>
          <h1>Deck Estimation</h1>
          <p className="subtitle">Question {questionNumber}</p>
        </div>
        <button type="button" className="link-button" onClick={onHome}>
          End
        </button>
      </header>

      <section className="count-math-stats" aria-label="Estimation accuracy">
        <span>Exact: {accuracy(stats.exact, stats.attempted)}</span>
        <span>Within ½ deck: {accuracy(stats.close, stats.attempted)}</span>
        <span>Avg miss: {stats.attempted === 0 ? '—' : `${averageDeckError(stats)} decks`}</span>
      </section>

      <section className="deck-estimation-table">
        <p className="deck-tray-hint">
          Hover or focus the tray to zoom in, and use the arrows to rotate it.
        </p>
        <CardTray
          cardCount={question.cardCount}
          zoomable
          rotatable
          label="Tray of cards to estimate"
          caption={grade ? formatDecks(question.decks) : undefined}
        />
        {settings.showReference && (
          <CardTray
            cardCount={decksToCards(1)}
            caption="Reference: 1 deck"
            label="Reference tray holding 1 deck"
            size="small"
          />
        )}
      </section>

      {!grade ? (
        <form
          className="deck-estimation-answer"
          onSubmit={(event) => {
            event.preventDefault();
            submitGuess();
          }}
        >
          <label className="field" htmlFor="deck-estimation-guess">
            <span>Your estimate: {formatDecks(guess)}</span>
            <input
              id="deck-estimation-guess"
              type="range"
              min={MIN_DECKS}
              max={MAX_DECKS}
              step={DECK_STEP}
              value={guess}
              onChange={(event) => setGuess(clampDecks(Number(event.target.value)))}
            />
          </label>
          <div className="deck-estimation-stepper">
            <button
              type="button"
              className="secondary-button"
              aria-label="Decrease estimate by half a deck"
              disabled={guess <= MIN_DECKS}
              onClick={() => adjustGuess(-DECK_STEP)}
            >
              −½
            </button>
            <strong aria-live="polite">{formatDecks(guess)}</strong>
            <button
              type="button"
              className="secondary-button"
              aria-label="Increase estimate by half a deck"
              disabled={guess >= MAX_DECKS}
              onClick={() => adjustGuess(DECK_STEP)}
            >
              +½
            </button>
          </div>
          <button type="submit" className="primary-button">
            Check estimate
          </button>
        </form>
      ) : (
        <section className="deck-estimation-feedback" aria-live="polite">
          <h2 className={grade.close ? 'feedback-correct' : 'feedback-incorrect'}>
            {grade.exact ? 'Spot on!' : grade.close ? 'Close — within half a deck' : 'Off by too much'}
          </h2>
          <p>
            Your estimate: <strong>{formatDecks(grade.guess)}</strong> · Actual:{' '}
            <strong>{formatDecks(grade.actual)}</strong>
          </p>
          <p>
            Missed by <strong>{grade.error}</strong> {grade.error === 1 ? 'deck' : 'decks'} (
            {question.cardCount} cards in the tray).
          </p>
          <button type="button" className="primary-button" onClick={nextQuestion}>
            Next tray
          </button>
        </section>
      )}

      <button
        type="button"
        className="secondary-button"
        aria-expanded={showTutorial}
        onClick={() => setShowTutorial((current) => !current)}
      >
        {showTutorial ? 'Hide tutorial' : 'Show tutorial'}
      </button>
      {showTutorial && <DeckEstimationTutorial />}
    </main>
  );
}
