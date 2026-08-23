import type { SessionSummary } from '../domain/session';

export interface SummaryScreenProps {
  summary: SessionSummary;
  onRestartSameSettings: () => void;
  onHome: () => void;
}

export function SummaryScreen({ summary, onRestartSameSettings, onHome }: SummaryScreenProps) {
  return (
    <main className="screen summary-screen">
      <h1>Session Summary</h1>
      <ul className="summary-stats">
        <li>
          <span>End reason</span>
          <strong>{summary.endReason === 'cut-card' ? 'Cut card reached' : 'Ended by user'}</strong>
        </li>
        <li>
          <span>Decks</span>
          <strong>{summary.deckCount}</strong>
        </li>
        <li>
          <span>Players</span>
          <strong>{summary.seatCount}</strong>
        </li>
        <li>
          <span>Rounds completed</span>
          <strong>{summary.roundsCompleted}</strong>
        </li>
        <li>
          <span>Visible cards dealt</span>
          <strong>{summary.visibleCardsDealt}</strong>
        </li>
        <li>
          <span>Questions answered</span>
          <strong>{summary.questionsAsked}</strong>
        </li>
        <li>
          <span>Correct</span>
          <strong>{summary.correctAnswers}</strong>
        </li>
        <li>
          <span>Incorrect</span>
          <strong>{summary.incorrectAnswers}</strong>
        </li>
        <li>
          <span>Accuracy</span>
          <strong>{summary.accuracyPercent}%</strong>
        </li>
        <li>
          <span>Final running count</span>
          <strong>{summary.finalRunningCount}</strong>
        </li>
      </ul>

      <h2>Answer history</h2>
      {summary.answers.length === 0 ? (
        <p>No questions were asked during this session.</p>
      ) : (
        <table className="answer-history">
          <thead>
            <tr>
              <th scope="col">Round</th>
              <th scope="col">Your answer</th>
              <th scope="col">Correct answer</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {summary.answers.map((a, i) => (
              <tr key={i} className={a.correct ? 'answer-row-correct' : 'answer-row-incorrect'}>
                <td>{a.roundNumber}</td>
                <td>{a.userAnswer}</td>
                <td>{a.correctAnswer}</td>
                <td>{a.correct ? 'Correct' : 'Incorrect'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="summary-actions">
        <button type="button" className="primary-button" onClick={onRestartSameSettings}>
          Restart with same settings
        </button>
        <button type="button" className="secondary-button" onClick={onHome}>
          Return home
        </button>
      </div>
    </main>
  );
}
