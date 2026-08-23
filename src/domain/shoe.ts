import { type Card, createDeck } from './cards';

export type Rng = () => number;

/** Fisher-Yates shuffle. Accepts an injectable RNG for deterministic tests. */
export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Sensible casino-style penetration range: 65%-85% of the shoe dealt. */
export const MIN_PENETRATION = 0.65;
export const MAX_PENETRATION = 0.85;

export interface ShoeOptions {
  deckCount: 2 | 4 | 6 | 8;
  rng?: Rng;
  /** Overrides randomized penetration selection; used for deterministic tests. */
  penetration?: number;
}

/**
 * Represents a multi-deck shoe with a randomized cut-card position.
 * Cards are dealt from the front of `cards`; `remainingCards()` reports how
 * many cards are left before the physical shoe is empty, while
 * `isPastCutCard()` reports whether the cut card has been crossed.
 */
export class Shoe {
  readonly deckCount: number;
  readonly totalCards: number;
  readonly cutCardIndex: number;
  private cards: Card[];
  private dealtCount = 0;

  constructor(options: ShoeOptions) {
    const { deckCount, rng = Math.random, penetration } = options;
    this.deckCount = deckCount;
    let all: Card[] = [];
    for (let i = 0; i < deckCount; i += 1) {
      all = all.concat(createDeck());
    }
    this.cards = shuffle(all, rng);
    this.totalCards = this.cards.length;

    const chosenPenetration =
      penetration ?? MIN_PENETRATION + rng() * (MAX_PENETRATION - MIN_PENETRATION);
    this.cutCardIndex = Math.round(this.totalCards * chosenPenetration);
  }

  /** Draws the next card from the shoe. Throws if the shoe is empty. */
  draw(): Card {
    if (this.dealtCount >= this.cards.length) {
      throw new Error('Shoe is empty');
    }
    const card = this.cards[this.dealtCount];
    this.dealtCount += 1;
    return card;
  }

  cardsDealt(): number {
    return this.dealtCount;
  }

  cardsRemaining(): number {
    return this.cards.length - this.dealtCount;
  }

  /** True once dealing has crossed the randomized cut-card position. */
  isPastCutCard(): boolean {
    return this.dealtCount >= this.cutCardIndex;
  }

  /** Fraction of the shoe dealt so far, from 0 to 1. */
  progress(): number {
    return this.dealtCount / this.totalCards;
  }
}
