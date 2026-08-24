import { describe, expect, it } from 'vitest';
import { cardValue, createDeck, hiLoValue } from '../cards';

describe('createDeck', () => {
  it('creates 52 unique cards covering every suit and rank', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const keys = new Set(deck.map((c) => `${c.rank}-${c.suit}`));
    expect(keys.size).toBe(52);
  });
});

describe('cardValue', () => {
  it('values number cards at face value', () => {
    expect(cardValue('2')).toBe(2);
    expect(cardValue('9')).toBe(9);
  });

  it('values face cards and tens at 10', () => {
    expect(cardValue('10')).toBe(10);
    expect(cardValue('J')).toBe(10);
    expect(cardValue('Q')).toBe(10);
    expect(cardValue('K')).toBe(10);
  });

  it('values aces at 11 (soft handling happens in hand evaluation)', () => {
    expect(cardValue('A')).toBe(11);
  });
});

describe('hiLoValue', () => {
  it('assigns +1 to low cards 2-6', () => {
    for (const rank of ['2', '3', '4', '5', '6'] as const) {
      expect(hiLoValue(rank)).toBe(1);
    }
  });

  it('assigns 0 to neutral cards 7-9', () => {
    for (const rank of ['7', '8', '9'] as const) {
      expect(hiLoValue(rank)).toBe(0);
    }
  });

  it('assigns -1 to ten-value cards and aces', () => {
    for (const rank of ['10', 'J', 'Q', 'K', 'A'] as const) {
      expect(hiLoValue(rank)).toBe(-1);
    }
  });
});
