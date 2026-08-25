import { createDeck, hiLoValue, type Card } from './cards';
import { type Rng, shuffle } from './shoe';
import { speedToDelayMs } from './session';

export type MissingCardDeckCount = 1 | 2 | 4 | 6 | 8;
export type HiLoGuess = -1 | 0 | 1;
export type MissingCardPhase = 'ready' | 'dealing' | 'paused' | 'guessing' | 'result';

export interface MissingCardSettings {
  deckCount: MissingCardDeckCount;
  speed: number;
}

export const DEFAULT_MISSING_CARD_SETTINGS: MissingCardSettings = {
  deckCount: 1,
  speed: 5,
};

export interface MissingCardResult {
  deckCount: MissingCardDeckCount;
  cardsDealt: number;
  cardsToDeal: number;
  hiddenCard: Card;
  guessedValue: HiLoGuess | null;
  correctValue: HiLoGuess;
  correct: boolean | null;
  endedEarly: boolean;
}

export interface MissingCardSnapshot {
  phase: MissingCardPhase;
  currentCard: Card | null;
  cardsDealt: number;
  cardsToDeal: number;
  progress: number;
  result: MissingCardResult | null;
  settings: MissingCardSettings;
}

export class MissingCardController {
  private readonly settings: MissingCardSettings;
  private readonly cards: Card[];
  private readonly hiddenCard: Card;
  private readonly onChange: () => void;
  private phase: MissingCardPhase = 'ready';
  private currentCard: Card | null = null;
  private cardsDealt = 0;
  private result: MissingCardResult | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(settings: MissingCardSettings, onChange: () => void, rng: Rng = Math.random) {
    this.settings = settings;
    this.onChange = onChange;

    const shoe: Card[] = [];
    for (let i = 0; i < settings.deckCount; i += 1) {
      shoe.push(...createDeck());
    }
    const shuffled = shuffle(shoe, rng);
    this.hiddenCard = shuffled.pop()!;
    this.cards = shuffled;
  }

  getSnapshot(): MissingCardSnapshot {
    return {
      phase: this.phase,
      currentCard: this.phase === 'dealing' ? this.currentCard : null,
      cardsDealt: this.cardsDealt,
      cardsToDeal: this.cards.length,
      progress: this.cardsDealt / this.cards.length,
      result: this.result,
      settings: this.settings,
    };
  }

  start(): void {
    if (this.phase !== 'ready') return;
    this.phase = 'dealing';
    this.showNextCard();
  }

  pause(): void {
    if (this.phase !== 'dealing') return;
    this.clearTimer();
    this.phase = 'paused';
    this.onChange();
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'dealing';
    this.scheduleNextCard();
    this.onChange();
  }

  endSession(): void {
    if (this.phase === 'result') return;
    this.clearTimer();
    this.currentCard = null;
    this.result = this.buildResult(null);
    this.phase = 'result';
    this.onChange();
  }

  submitGuess(guess: HiLoGuess): void {
    if (this.phase !== 'guessing') return;
    this.result = this.buildResult(guess);
    this.phase = 'result';
    this.onChange();
  }

  destroy(): void {
    this.clearTimer();
  }

  private showNextCard(): void {
    if (this.phase !== 'dealing') return;
    if (this.cardsDealt >= this.cards.length) {
      this.currentCard = null;
      this.phase = 'guessing';
      this.onChange();
      return;
    }

    this.currentCard = this.cards[this.cardsDealt];
    this.cardsDealt += 1;
    this.onChange();
    this.scheduleNextCard();
  }

  private scheduleNextCard(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.showNextCard();
    }, speedToDelayMs(this.settings.speed));
  }

  private buildResult(guess: HiLoGuess | null): MissingCardResult {
    const correctValue = hiLoValue(this.hiddenCard.rank);
    return {
      deckCount: this.settings.deckCount,
      cardsDealt: this.cardsDealt,
      cardsToDeal: this.cards.length,
      hiddenCard: this.hiddenCard,
      guessedValue: guess,
      correctValue,
      correct: guess === null ? null : guess === correctValue,
      endedEarly: this.cardsDealt < this.cards.length,
    };
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
