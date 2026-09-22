/**
 * Deck estimation drill: look at a tray of cards and judge how many decks it holds.
 * Answers are given in half-deck steps between 0.5 and 8 decks.
 */

export const CARDS_PER_DECK = 52;
export const MIN_DECKS = 0.5;
export const MAX_DECKS = 8;
export const DECK_STEP = 0.5;

export type DeckEstimationDifficulty = 'whole' | 'half';

export interface DeckEstimationSettings {
  /** 'whole' only asks for full decks; 'half' also uses half-deck trays. */
  difficulty: DeckEstimationDifficulty;
  maxDecks: number;
  /** Shows a labelled one-deck tray beside the question. */
  showReference: boolean;
}

export const DEFAULT_DECK_ESTIMATION_SETTINGS: DeckEstimationSettings = {
  difficulty: 'half',
  maxDecks: MAX_DECKS,
  showReference: true,
};

export interface DeckEstimationQuestion {
  id: string;
  decks: number;
  cardCount: number;
}

export interface DeckEstimationStats {
  attempted: number;
  exact: number;
  /** Answers within half a deck of the truth (includes exact answers). */
  close: number;
  totalError: number;
}

export interface DeckEstimationGrade {
  guess: number;
  actual: number;
  error: number;
  exact: boolean;
  close: boolean;
}

let questionId = 0;

/** Rounds a deck amount to the nearest legal half-deck step inside the allowed range. */
export function clampDecks(decks: number, maxDecks: number = MAX_DECKS): number {
  const upperBound = Math.max(MIN_DECKS, Math.min(MAX_DECKS, maxDecks));
  const stepped = Math.round(decks / DECK_STEP) * DECK_STEP;
  return Math.min(upperBound, Math.max(MIN_DECKS, stepped));
}

/** All selectable deck amounts for a given maximum, in half-deck steps. */
export function deckOptions(maxDecks: number = MAX_DECKS): number[] {
  const upperBound = clampDecks(maxDecks, maxDecks);
  const options: number[] = [];
  for (let decks = MIN_DECKS; decks <= upperBound + 1e-9; decks += DECK_STEP) {
    options.push(Number(decks.toFixed(1)));
  }
  return options;
}

export function decksToCards(decks: number): number {
  return Math.round(decks * CARDS_PER_DECK);
}

export function formatDecks(decks: number): string {
  const label = Number.isInteger(decks) ? `${decks}` : decks.toFixed(1);
  return `${label} ${decks === 1 ? 'deck' : 'decks'}`;
}

export function createDeckEstimationQuestion(
  settings: DeckEstimationSettings,
  rng: () => number = Math.random,
): DeckEstimationQuestion {
  const maxDecks = clampDecks(settings.maxDecks, settings.maxDecks);
  const step = settings.difficulty === 'whole' ? 1 : DECK_STEP;
  const minDecks = settings.difficulty === 'whole' ? 1 : MIN_DECKS;
  const stepCount = Math.max(1, Math.floor((maxDecks - minDecks) / step) + 1);
  const decks = Number((minDecks + Math.floor(rng() * stepCount) * step).toFixed(1));

  questionId += 1;
  return {
    id: `deck-estimation-${questionId}`,
    decks,
    cardCount: decksToCards(decks),
  };
}

export function gradeDeckEstimation(guess: number, actual: number): DeckEstimationGrade {
  const error = Number(Math.abs(guess - actual).toFixed(1));
  return {
    guess,
    actual,
    error,
    exact: error === 0,
    close: error <= DECK_STEP,
  };
}

export function createEmptyDeckEstimationStats(): DeckEstimationStats {
  return { attempted: 0, exact: 0, close: 0, totalError: 0 };
}

export function recordDeckEstimation(
  stats: DeckEstimationStats,
  grade: DeckEstimationGrade,
): DeckEstimationStats {
  return {
    attempted: stats.attempted + 1,
    exact: stats.exact + (grade.exact ? 1 : 0),
    close: stats.close + (grade.close ? 1 : 0),
    totalError: Number((stats.totalError + grade.error).toFixed(1)),
  };
}

export function averageDeckError(stats: DeckEstimationStats): number {
  if (stats.attempted === 0) return 0;
  return Number((stats.totalError / stats.attempted).toFixed(2));
}
