import { PlayingCard } from '../components/PlayingCard';
import type { HiLoGuess, MissingCardResult } from '../domain/missingCardController';

export interface MissingCardResultScreenProps {
  result: MissingCardResult;
  onReplay: () => void;
  onHome: () => void;
}

function formatValue(value: HiLoGuess): string {
  return value > 0 ? '+1' : value < 0 ? '−1' : '0';
}

export function MissingCardResultScreen({ result, onReplay, onHome }: MissingCardResultScreenProps) {
  return (
    <main className="screen summary-screen">
      <h1>Missing Card Result</h1>
      {result.correct === null ? (
        <p className="subtitle">{result.endedEarly ? 'Session ended early.' : 'No guess submitted.'}</p>
      ) : (
        <p className={result.correct ? 'feedback-correct' : 'feedback-incorrect'}>
          {result.correct ? 'Correct!' : 'Incorrect'}
        </p>
      )}

      <div className="missing-card-reveal">
        <span>Hidden card</span>
        <PlayingCard rank={result.hiddenCard.rank} suit={result.hiddenCard.suit} faceUp />
      </div>

      <ul className="summary-stats">
        <li>
          <span>Your guess</span>
          <strong>{result.guessedValue === null ? 'Not submitted' : formatValue(result.guessedValue)}</strong>
        </li>
        <li>
          <span>Correct Hi-Lo value</span>
          <strong>{formatValue(result.correctValue)}</strong>
        </li>
        <li>
          <span>Cards dealt</span>
          <strong>
            {result.cardsDealt} / {result.cardsToDeal}
          </strong>
        </li>
        <li>
          <span>Decks</span>
          <strong>{result.deckCount}</strong>
        </li>
      </ul>

      <div className="summary-actions">
        <button type="button" className="primary-button" onClick={onReplay}>
          Replay with same settings
        </button>
        <button type="button" className="secondary-button" onClick={onHome}>
          Return home
        </button>
      </div>
    </main>
  );
}
