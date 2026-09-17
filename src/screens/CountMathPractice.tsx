import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PlayingCard } from '../components/PlayingCard';
import {
  createCountMathQuestion,
  createEmptyCountMathStats,
  progressiveCardCount,
  recordCountMathAnswer,
  type CountMathQuestion,
  type CountMathSettings,
} from '../domain/countMath';

export interface CountMathPracticeProps {
  settings: CountMathSettings;
  onHome: () => void;
}

interface Feedback {
  correct: boolean;
  userAnswer: number | null;
}

function formatCount(value: number): string {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0';
}

function directionLabel(question: CountMathQuestion): string {
  return question.transition === 'positive-to-negative' ? 'Positive → negative' : 'Negative → positive';
}

function accuracy(correct: number, attempted: number): string {
  return attempted === 0 ? '—' : `${Math.round((correct / attempted) * 100)}%`;
}

export function CountMathPractice({ settings, onHome }: CountMathPracticeProps) {
  const firstCardCount = settings.progressive ? progressiveCardCount(1, settings.cardCount) : settings.cardCount;
  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState(() => createCountMathQuestion(settings, firstCardCount));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState(createEmptyCountMathStats);
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.timerSeconds);
  const answerRecorded = useRef(false);

  useEffect(() => {
    if (settings.timerSeconds === 0 || feedback) return;

    const interval = window.setInterval(() => {
      setTimeRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    const timeout = window.setTimeout(() => {
      if (answerRecorded.current) return;
      answerRecorded.current = true;
      setFeedback({ correct: false, userAnswer: null });
      setStats((current) => recordCountMathAnswer(current, question.transition, false));
    }, settings.timerSeconds * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [feedback, question, settings.timerSeconds]);

  function submitAnswer(event: FormEvent) {
    event.preventDefault();
    if (answerRecorded.current || answer.trim() === '') return;
    const userAnswer = Number(answer);
    if (!Number.isInteger(userAnswer)) return;
    answerRecorded.current = true;
    const correct = userAnswer === question.answer;
    setFeedback({ correct, userAnswer });
    setStats((current) => recordCountMathAnswer(current, question.transition, correct));
  }

  function nextQuestion() {
    const nextNumber = questionNumber + 1;
    const cardCount = settings.progressive
      ? progressiveCardCount(nextNumber, settings.cardCount)
      : settings.cardCount;
    setQuestionNumber(nextNumber);
    setQuestion(createCountMathQuestion(settings, cardCount));
    setAnswer('');
    answerRecorded.current = false;
    setFeedback(null);
    setTimeRemaining(settings.timerSeconds);
  }

  function toggleSign() {
    setAnswer((current) => (current.startsWith('-') ? current.slice(1) : `-${current}`));
  }

  return (
    <main className="screen count-math-screen">
      <header className="count-math-header">
        <div>
          <h1>Count Math</h1>
          <p className="subtitle">Question {questionNumber} · {directionLabel(question)}</p>
        </div>
        <button type="button" className="link-button" onClick={onHome}>End</button>
      </header>

      <section className="count-math-stats" aria-label="Accuracy by transition">
        <span>+ → −: {accuracy(stats['positive-to-negative'].correct, stats['positive-to-negative'].attempted)}</span>
        <span>− → +: {accuracy(stats['negative-to-positive'].correct, stats['negative-to-positive'].attempted)}</span>
      </section>

      <section className="count-math-question">
        <p>Starting count</p>
        <strong className="starting-count">{formatCount(question.startingCount)}</strong>
        <p>Apply these {question.values.length === 1 ? 'card' : 'cards'} in order:</p>
        {settings.displayMode === 'cards' ? (
          <div className="count-math-cards" aria-label="Cards to count">
            {question.cards.map((card) => (
              <PlayingCard key={card.id} rank={card.rank} suit={card.suit} faceUp />
            ))}
          </div>
        ) : (
          <div className="count-math-values" aria-label="Hi-Lo values to count">
            {question.values.map((value, index) => (
              <span key={`${question.id}-${index}`}>{formatCount(value)}</span>
            ))}
          </div>
        )}
      </section>

      {!feedback ? (
        <form className="count-math-answer" onSubmit={submitAnswer}>
          {settings.timerSeconds > 0 && <p className="count-math-timer">Time remaining: {timeRemaining}s</p>}
          <label className="field" htmlFor="count-math-answer">
            <span>Resulting count</span>
            <div className="count-answer-control">
              <input
                id="count-math-answer"
                className="count-answer-input"
                type="text"
                inputMode="numeric"
                pattern="-?[0-9]*"
                value={answer}
                autoFocus
                autoComplete="off"
                onChange={(event) => {
                  if (/^-?[0-9]*$/.test(event.target.value)) setAnswer(event.target.value);
                }}
              />
              <button
                type="button"
                className="secondary-button sign-toggle"
                aria-label="Toggle sign"
                disabled={answer === ''}
                onClick={toggleSign}
              >
                +/−
              </button>
            </div>
          </label>
          <button type="submit" className="primary-button">Check answer</button>
        </form>
      ) : (
        <section className="count-math-feedback" aria-live="polite">
          <h2 className={feedback.correct ? 'feedback-correct' : 'feedback-incorrect'}>
            {feedback.correct ? 'Correct!' : feedback.userAnswer === null ? 'Time is up' : 'Incorrect'}
          </h2>
          <p>
            {feedback.userAnswer === null ? 'No answer' : `Your answer: ${formatCount(feedback.userAnswer)}`}
            {' · '}Correct answer: <strong>{formatCount(question.answer)}</strong>
          </p>
          <p>Net change: <strong>{formatCount(question.netChange)}</strong></p>
          <div>
            <span>Step by step</span>
            <ol className="count-progression">
              {question.progression.map((count, index) => (
                <li key={`${question.id}-step-${index}`}>{formatCount(count)}</li>
              ))}
            </ol>
          </div>
          <button type="button" className="primary-button" autoFocus onClick={nextQuestion}>
            Next question
          </button>
        </section>
      )}
    </main>
  );
}
