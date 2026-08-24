import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { getBasicStrategyAction } from '../basicStrategy';

function card(rank: Card['rank']): Card {
  return { id: `${rank}-${Math.random()}`, rank, suit: 'clubs' };
}

describe('getBasicStrategyAction', () => {
  it('always stands on hard 17+', () => {
    const action = getBasicStrategyAction({
      cards: [card('10'), card('7')],
      dealerUpcard: '6',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(action).toBe('stand');
  });

  it('always hits hard totals of 8 or less', () => {
    const action = getBasicStrategyAction({
      cards: [card('3'), card('4')],
      dealerUpcard: '10',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(action).toBe('hit');
  });

  it('doubles hard 11 against any dealer upcard when allowed', () => {
    for (const up of ['2', '5', '9', '10', 'A'] as const) {
      const action = getBasicStrategyAction({
        cards: [card('6'), card('5')],
        dealerUpcard: up,
        canDouble: true,
        canSplit: false,
        isSplitAces: false,
      });
      expect(action).toBe('double');
    }
  });

  it('hits instead of doubling when doubling is not allowed', () => {
    const action = getBasicStrategyAction({
      cards: [card('6'), card('5'), card('2')], // 3-card 13, not double-eligible anyway
      dealerUpcard: '10',
      canDouble: false,
      canSplit: false,
      isSplitAces: false,
    });
    expect(action).toBe('hit');
  });

  it('stands on hard 12 against a dealer 4-6, hits otherwise', () => {
    const standCase = getBasicStrategyAction({
      cards: [card('10'), card('2')],
      dealerUpcard: '5',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(standCase).toBe('stand');

    const hitCase = getBasicStrategyAction({
      cards: [card('10'), card('2')],
      dealerUpcard: '7',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(hitCase).toBe('hit');
  });

  it('splits aces whenever splitting is allowed', () => {
    const action = getBasicStrategyAction({
      cards: [card('A'), card('A')],
      dealerUpcard: '6',
      canDouble: true,
      canSplit: true,
      isSplitAces: false,
    });
    expect(action).toBe('split');
  });

  it('never splits a pair of tens (stands instead)', () => {
    const action = getBasicStrategyAction({
      cards: [card('K'), card('10')],
      dealerUpcard: '6',
      canDouble: true,
      canSplit: true,
      isSplitAces: false,
    });
    expect(action).toBe('stand');
  });

  it('splits 8s against any dealer upcard', () => {
    for (const up of ['2', '7', '10', 'A'] as const) {
      const action = getBasicStrategyAction({
        cards: [card('8'), card('8')],
        dealerUpcard: up,
        canDouble: true,
        canSplit: true,
        isSplitAces: false,
      });
      expect(action).toBe('split');
    }
  });

  it('stands immediately on split-ace hands regardless of total', () => {
    const action = getBasicStrategyAction({
      cards: [card('A'), card('6')],
      dealerUpcard: '10',
      canDouble: false,
      canSplit: false,
      isSplitAces: true,
    });
    expect(action).toBe('stand');
  });

  it('does not offer split when canSplit is false even for a pair', () => {
    const action = getBasicStrategyAction({
      cards: [card('8'), card('8')],
      dealerUpcard: '6',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(action).not.toBe('split');
  });

  it('doubles soft 18 against dealer 6, stands against 7/8, hits against 9/10/A', () => {
    const doubleCase = getBasicStrategyAction({
      cards: [card('A'), card('7')],
      dealerUpcard: '6',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(doubleCase).toBe('double');

    const standCase = getBasicStrategyAction({
      cards: [card('A'), card('7')],
      dealerUpcard: '8',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(standCase).toBe('stand');

    const hitCase = getBasicStrategyAction({
      cards: [card('A'), card('7')],
      dealerUpcard: '9',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(hitCase).toBe('hit');
  });

  it('always stands on soft 20', () => {
    const action = getBasicStrategyAction({
      cards: [card('A'), card('9')],
      dealerUpcard: 'A',
      canDouble: true,
      canSplit: false,
      isSplitAces: false,
    });
    expect(action).toBe('stand');
  });
});
