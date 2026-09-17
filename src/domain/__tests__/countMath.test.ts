import { describe, expect, it } from 'vitest';
import {
  createCountMathQuestion,
  createEmptyCountMathStats,
  DEFAULT_COUNT_MATH_SETTINGS,
  progressiveCardCount,
  recordCountMathAnswer,
} from '../countMath';

const lowRng = () => 0;

describe('Count Math', () => {
  it('crosses from a positive count to a negative count', () => {
    const question = createCountMathQuestion(
      { ...DEFAULT_COUNT_MATH_SETTINGS, transitionMode: 'positive-to-negative', cardCount: 4 },
      4,
      lowRng,
    );

    expect(question.startingCount).toBe(1);
    expect(question.answer).toBeLessThan(0);
    expect(question.progression).toEqual([1, 0, 1, 0, -1]);
  });

  it('crosses from a negative count to a positive count', () => {
    const question = createCountMathQuestion(
      { ...DEFAULT_COUNT_MATH_SETTINGS, transitionMode: 'negative-to-positive', cardCount: 4 },
      4,
      lowRng,
    );

    expect(question.startingCount).toBe(-1);
    expect(question.answer).toBeGreaterThan(0);
    expect(question.progression).toEqual([-1, 0, -1, 0, 1]);
  });

  it('uses both directions in mixed mode', () => {
    const positive = createCountMathQuestion(DEFAULT_COUNT_MATH_SETTINGS, 3, () => 0);
    const negative = createCountMathQuestion(DEFAULT_COUNT_MATH_SETTINGS, 3, () => 0.75);

    expect(positive.transition).toBe('positive-to-negative');
    expect(negative.transition).toBe('negative-to-positive');
  });

  it('occasionally uses the full configured starting range when crossing is impossible', () => {
    const question = createCountMathQuestion(
      {
        ...DEFAULT_COUNT_MATH_SETTINGS,
        maxStartingCount: 10,
        transitionMode: 'positive-to-negative',
      },
      3,
      () => 0.99,
    );

    expect(question.startingCount).toBe(10);
    expect(question.answer).toBe(7);
  });

  it('tracks each transition direction separately', () => {
    let stats = createEmptyCountMathStats();
    stats = recordCountMathAnswer(stats, 'positive-to-negative', true);
    stats = recordCountMathAnswer(stats, 'negative-to-positive', false);

    expect(stats['positive-to-negative']).toEqual({ correct: 1, attempted: 1 });
    expect(stats['negative-to-positive']).toEqual({ correct: 0, attempted: 1 });
  });

  it('increases progressive difficulty every three questions', () => {
    expect([1, 2, 3, 4, 7, 20].map((number) => progressiveCardCount(number, 5))).toEqual([
      1, 1, 1, 2, 3, 5,
    ]);
  });
});
