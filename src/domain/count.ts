import { type Card, hiLoValue } from './cards';

/**
 * Tracks the Hi-Lo running count. A card only affects the count once it is
 * revealed to the learner (e.g. the dealer's hole card is excluded until it
 * is flipped face-up).
 */
export class RunningCount {
  private count = 0;

  value(): number {
    return this.count;
  }

  reset(): void {
    this.count = 0;
  }

  /** Applies a single revealed card to the running count. */
  addCard(card: Card): void {
    this.count += hiLoValue(card.rank);
  }

  /** Applies several revealed cards at once. */
  addCards(cards: Card[]): void {
    for (const card of cards) this.addCard(card);
  }
}
