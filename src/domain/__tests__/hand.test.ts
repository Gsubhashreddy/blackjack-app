import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { evaluateHand, isPair } from '../hand';

function card(rank: Card['rank'], id: string = rank): Card {
  return { id, rank, suit: 'spades' };
}

describe('evaluateHand', () => {
  it('sums hard totals with no aces', () => {
    const result = evaluateHand([card('9'), card('8')]);
    expect(result).toEqual({ total: 17, soft: false, busted: false, blackjack: false });
  });

  it('counts a single ace as 11 when it does not bust', () => {
    const result = evaluateHand([card('A'), card('6')]);
    expect(result.total).toBe(17);
    expect(result.soft).toBe(true);
    expect(result.busted).toBe(false);
  });

  it('downgrades an ace to 1 when 11 would bust', () => {
    const result = evaluateHand([card('A'), card('9'), card('5')]);
    expect(result.total).toBe(15);
    expect(result.soft).toBe(false);
    expect(result.busted).toBe(false);
  });

  it('downgrades multiple aces as needed', () => {
    const result = evaluateHand([card('A'), card('A'), card('9')]);
    // A+A+9 = 11+11+9=31 -> one ace to 1 => 21 -> soft (one ace still counts as 11)
    expect(result.total).toBe(21);
    expect(result.soft).toBe(true);
    expect(result.busted).toBe(false);
  });

  it('detects a bust', () => {
    const result = evaluateHand([card('K'), card('Q'), card('5')]);
    expect(result.busted).toBe(true);
    expect(result.total).toBe(25);
  });

  it('detects a natural blackjack only with exactly two cards totaling 21', () => {
    const blackjack = evaluateHand([card('A'), card('K')]);
    expect(blackjack.blackjack).toBe(true);

    const twentyOneWithThree = evaluateHand([card('7'), card('7'), card('7')]);
    expect(twentyOneWithThree.total).toBe(21);
    expect(twentyOneWithThree.blackjack).toBe(false);
  });
});

describe('isPair', () => {
  it('returns true for two cards of equal blackjack value', () => {
    expect(isPair([card('8'), card('8', '8b')])).toBe(true);
    expect(isPair([card('10'), card('K')])).toBe(true);
  });

  it('returns false for unequal cards or more than two cards', () => {
    expect(isPair([card('8'), card('9')])).toBe(false);
    expect(isPair([card('8'), card('8', '8b'), card('8', '8c')])).toBe(false);
  });
});
