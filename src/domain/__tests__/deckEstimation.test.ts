import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DECK_ESTIMATION_SETTINGS,
  averageDeckError,
  clampDecks,
  createDeckEstimationQuestion,
  createEmptyDeckEstimationStats,
  deckOptions,
  decksToCards,
  formatDecks,
  gradeDeckEstimation,
  recordDeckEstimation,
  type DeckEstimationSettings,
} from '../deckEstimation';

function settings(overrides: Partial<DeckEstimationSettings> = {}): DeckEstimationSettings {
  return { ...DEFAULT_DECK_ESTIMATION_SETTINGS, ...overrides };
}

describe('deckEstimation', () => {
  it('clamps answers to half-deck steps between 0.5 and 8', () => {
    expect(clampDecks(0)).toBe(0.5);
    expect(clampDecks(12)).toBe(8);
    expect(clampDecks(3.3)).toBe(3.5);
    expect(clampDecks(3.2)).toBe(3);
    expect(clampDecks(7, 4)).toBe(4);
  });

  it('lists every half-deck option up to the maximum', () => {
    expect(deckOptions(2)).toEqual([0.5, 1, 1.5, 2]);
    expect(deckOptions()).toHaveLength(16);
  });

  it('converts decks to cards and formats labels', () => {
    expect(decksToCards(0.5)).toBe(26);
    expect(decksToCards(8)).toBe(416);
    expect(formatDecks(1)).toBe('1 deck');
    expect(formatDecks(1.5)).toBe('1.5 decks');
    expect(formatDecks(4)).toBe('4 decks');
  });

  it('generates whole-deck questions within the configured maximum', () => {
    for (let index = 0; index < 20; index += 1) {
      const question = createDeckEstimationQuestion(settings({ difficulty: 'whole', maxDecks: 6 }));
      expect(Number.isInteger(question.decks)).toBe(true);
      expect(question.decks).toBeGreaterThanOrEqual(1);
      expect(question.decks).toBeLessThanOrEqual(6);
      expect(question.cardCount).toBe(question.decks * 52);
    }
  });

  it('generates half-deck questions within the configured maximum', () => {
    const seen = new Set<number>();
    for (let index = 0; index < 200; index += 1) {
      const question = createDeckEstimationQuestion(settings({ maxDecks: 3 }));
      expect(deckOptions(3)).toContain(question.decks);
      seen.add(question.decks);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('never exceeds the maximum with an rng at the top of its range', () => {
    const question = createDeckEstimationQuestion(settings({ maxDecks: 8 }), () => 0.999999);
    expect(question.decks).toBe(8);
  });

  it('grades exact and near answers', () => {
    expect(gradeDeckEstimation(4, 4)).toMatchObject({ error: 0, exact: true, close: true });
    expect(gradeDeckEstimation(4.5, 4)).toMatchObject({ error: 0.5, exact: false, close: true });
    expect(gradeDeckEstimation(6, 4)).toMatchObject({ error: 2, exact: false, close: false });
  });

  it('accumulates stats and average error', () => {
    let stats = createEmptyDeckEstimationStats();
    stats = recordDeckEstimation(stats, gradeDeckEstimation(4, 4));
    stats = recordDeckEstimation(stats, gradeDeckEstimation(3, 4));
    expect(stats).toMatchObject({ attempted: 2, exact: 1, close: 1, totalError: 1 });
    expect(averageDeckError(stats)).toBe(0.5);
    expect(averageDeckError(createEmptyDeckEstimationStats())).toBe(0);
  });
});
