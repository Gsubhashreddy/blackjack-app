import { describe, expect, it } from 'vitest';
import { MAX_PENETRATION, MIN_PENETRATION, Shoe, shuffle } from '../shoe';

function sequentialRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

describe('shuffle', () => {
  it('preserves all items and does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, () => 0.5);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a given rng', () => {
    const rng = () => 0;
    const a = shuffle([1, 2, 3, 4], rng);
    const b = shuffle([1, 2, 3, 4], rng);
    expect(a).toEqual(b);
  });
});

describe('Shoe', () => {
  it('builds the correct total number of cards for each deck count', () => {
    for (const deckCount of [2, 4, 6, 8] as const) {
      const shoe = new Shoe({ deckCount, rng: () => 0.5 });
      expect(shoe.totalCards).toBe(deckCount * 52);
    }
  });

  it('deals cards one at a time and tracks remaining count', () => {
    const shoe = new Shoe({ deckCount: 2, rng: () => 0.5, penetration: 0.75 });
    expect(shoe.cardsDealt()).toBe(0);
    shoe.draw();
    shoe.draw();
    expect(shoe.cardsDealt()).toBe(2);
    expect(shoe.cardsRemaining()).toBe(shoe.totalCards - 2);
  });

  it('throws once the physical shoe is exhausted', () => {
    const shoe = new Shoe({ deckCount: 2, rng: () => 0.5, penetration: 0.75 });
    for (let i = 0; i < shoe.totalCards; i += 1) shoe.draw();
    expect(() => shoe.draw()).toThrow();
  });

  it('chooses a randomized cut card within the sensible penetration range', () => {
    const rngValues = [0.1, 0.9, 0.3, 0.7];
    for (const value of rngValues) {
      const shoe = new Shoe({ deckCount: 6, rng: sequentialRng([value]) });
      const penetration = shoe.cutCardIndex / shoe.totalCards;
      expect(penetration).toBeGreaterThanOrEqual(MIN_PENETRATION - 0.001);
      expect(penetration).toBeLessThanOrEqual(MAX_PENETRATION + 0.001);
    }
  });

  it('honors an explicit penetration override for deterministic tests', () => {
    const shoe = new Shoe({ deckCount: 2, rng: () => 0.5, penetration: 0.7 });
    expect(shoe.cutCardIndex).toBe(Math.round(shoe.totalCards * 0.7));
  });

  it('reports isPastCutCard only once dealt count reaches the cut card index', () => {
    const shoe = new Shoe({ deckCount: 2, rng: () => 0.5, penetration: 0.02 });
    expect(shoe.cutCardIndex).toBeGreaterThan(0);
    expect(shoe.isPastCutCard()).toBe(false);
    for (let i = 0; i < shoe.cutCardIndex; i += 1) shoe.draw();
    expect(shoe.isPastCutCard()).toBe(true);
  });
});
