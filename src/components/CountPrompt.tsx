import { useEffect, useRef, useState } from 'react';
import type { AnswerFeedback } from '../domain/practiceController';

export interface CountPromptProps {
  visible: boolean;
  feedback: AnswerFeedback | null;
  onSubmit: (value: number) => void;
  onContinue: () => void;
}

export function CountPrompt({ visible, feedback, onSubmit, onContinue }: CountPromptProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (visible && !feedback) {
      inputRef.current?.focus();
    }
  }, [visible, feedback]);

  useEffect(() => {
    if (feedback) {
      continueButtonRef.current?.focus();
    }
  }, [feedback]);

  if (!visible) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (value.trim() === '' || Number.isNaN(parsed)) return;
    setValue('');
    onSubmit(parsed);
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal count-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="count-prompt-title"
      >
        <h2 id="count-prompt-title">What is the running count?</h2>
        {!feedback ? (
          <form onSubmit={handleSubmit}>
            <label className="field" htmlFor="running-count-input">
              <span>Your answer</span>
              <input
                id="running-count-input"
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="-?[0-9]*"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button type="submit" className="primary-button">
              Submit
            </button>
          </form>
        ) : (
          <div className="answer-feedback" role="status">
            <p className={feedback.correct ? 'feedback-correct' : 'feedback-incorrect'}>
              {feedback.correct ? 'Correct!' : 'Incorrect'}
            </p>
            <p>Your answer: {feedback.userAnswer}</p>
            {!feedback.correct && <p>Correct running count: {feedback.correctAnswer}</p>}
            <button type="button" className="primary-button" ref={continueButtonRef} onClick={onContinue}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
