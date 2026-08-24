/**
 * Core card primitives shared across the domain layer.
 */

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
export const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

export interface Card {
  /** Stable unique id for React keys and debugging. */
  id: string;
  rank: Rank;
  suit: Suit;
}

/**
 * Blackjack value of a card. Aces are valued as 11 here; hand evaluation
 * logic downgrades aces to 1 as needed to avoid busting.
 */
export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K' || rank === '10') return 10;
  return Number(rank);
}

/** Hi-Lo count contribution of a single card. */
export function hiLoValue(rank: Rank): -1 | 0 | 1 {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
  if (['7', '8', '9'].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

let idCounter = 0;

/** Builds a single deck of 52 unique cards. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      idCounter += 1;
      deck.push({ id: `c${idCounter}`, rank, suit });
    }
  }
  return deck;
}
