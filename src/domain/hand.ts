import { type Card, cardValue } from './cards';

export interface HandTotal {
  /** Best total <= 21 when possible, otherwise the minimal busted total. */
  total: number;
  /** True when an ace is counted as 11 in the best total. */
  soft: boolean;
  busted: boolean;
  /** Natural blackjack: exactly two cards totaling 21. */
  blackjack: boolean;
}

/**
 * Evaluates a set of cards using standard Blackjack rules: aces count as 11
 * unless that would bust the hand, in which case they count as 1 one at a
 * time until the hand is 21 or under (or all aces have been downgraded).
 */
export function evaluateHand(cards: Card[]): HandTotal {
  let total = 0;
  let aceCount = 0;

  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === 'A') aceCount += 1;
  }

  let softAcesRemaining = aceCount;
  while (total > 21 && softAcesRemaining > 0) {
    total -= 10;
    softAcesRemaining -= 1;
  }

  const soft = softAcesRemaining > 0;
  const busted = total > 21;
  const blackjack = cards.length === 2 && total === 21;

  return { total, soft, busted, blackjack };
}

/** Convenience helper: is this a pair for splitting purposes? */
export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cardValue(cards[0].rank) === cardValue(cards[1].rank);
}
