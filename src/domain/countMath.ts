import type { Card, Rank, Suit } from './cards';

export type CountMathTransition = 'positive-to-negative' | 'negative-to-positive';
export type CountMathTransitionMode = CountMathTransition | 'mixed';
export type CountMathDisplayMode = 'cards' | 'values';
export type CountMathTimerSeconds = 0 | 5 | 10 | 15;

export interface CountMathSettings {
  startingCountRange: number;
  cardCount: number;
  transitionMode: CountMathTransitionMode;
  displayMode: CountMathDisplayMode;
  timerSeconds: CountMathTimerSeconds;
  progressive: boolean;
}

export const DEFAULT_COUNT_MATH_SETTINGS: CountMathSettings = {
  startingCountRange: 5,
  cardCount: 5,
  transitionMode: 'mixed',
  displayMode: 'cards',
  timerSeconds: 0,
  progressive: true,
};

export interface CountMathQuestion {
  id: string;
  transition: CountMathTransition;
  startingCount: number;
  cards: Card[];
  values: (-1 | 0 | 1)[];
  progression: number[];
  netChange: number;
  answer: number;
}

export interface CountMathDirectionStats {
  correct: number;
  attempted: number;
}

export type CountMathStats = Record<CountMathTransition, CountMathDirectionStats>;

const NEGATIVE_RANKS: Rank[] = ['10', 'J', 'Q', 'K', 'A'];
const POSITIVE_RANKS: Rank[] = ['2', '3', '4', '5', '6'];
const NEUTRAL_RANKS: Rank[] = ['7', '8', '9'];
const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

let questionId = 0;

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function cardForValue(value: -1 | 0 | 1, index: number, rng: () => number): Card {
  const ranks = value < 0 ? NEGATIVE_RANKS : value > 0 ? POSITIVE_RANKS : NEUTRAL_RANKS;
  return {
    id: `count-math-${questionId}-${index}`,
    rank: pick(ranks, rng),
    suit: pick(SUITS, rng),
  };
}

function chooseTransition(mode: CountMathTransitionMode, rng: () => number): CountMathTransition {
  if (mode !== 'mixed') return mode;
  return rng() < 0.5 ? 'positive-to-negative' : 'negative-to-positive';
}

function buildValues(
  transition: CountMathTransition,
  startingMagnitude: number,
  cardCount: number,
): (-1 | 0 | 1)[] {
  const towardZero = transition === 'positive-to-negative' ? -1 : 1;
  const awayFromZero = -towardZero as -1 | 1;
  const values: (-1 | 0 | 1)[] = [];

  if (cardCount >= startingMagnitude + 3) {
    values.push(towardZero, awayFromZero);
    for (let index = 0; index < startingMagnitude + 1; index += 1) values.push(towardZero);
  } else {
    const movementCards = Math.min(cardCount, startingMagnitude + 1);
    for (let index = 0; index < movementCards; index += 1) values.push(towardZero);
  }

  while (values.length < cardCount) values.push(0);
  return values;
}

export function createCountMathQuestion(
  settings: CountMathSettings,
  cardCount = settings.cardCount,
  rng: () => number = Math.random,
): CountMathQuestion {
  const safeCardCount = Math.max(1, Math.min(10, Math.round(cardCount)));
  const transition = chooseTransition(settings.transitionMode, rng);
  const configuredMaximum = Math.max(1, Math.round(settings.startingCountRange));
  const shouldCrossZero = safeCardCount > 1 && rng() < 0.8;
  const maximumStart = shouldCrossZero
    ? Math.min(configuredMaximum, safeCardCount - 1)
    : configuredMaximum;
  const startingMagnitude = 1 + Math.floor(rng() * maximumStart);
  const startingCount =
    transition === 'positive-to-negative' ? startingMagnitude : -startingMagnitude;
  const values = buildValues(transition, startingMagnitude, safeCardCount);
  const progression = [startingCount];

  for (const value of values) progression.push(progression[progression.length - 1] + value);

  questionId += 1;
  const answer = progression[progression.length - 1];
  return {
    id: `count-math-question-${questionId}`,
    transition,
    startingCount,
    values,
    cards: values.map((value, index) => cardForValue(value, index, rng)),
    progression,
    netChange: answer - startingCount,
    answer,
  };
}

export function createEmptyCountMathStats(): CountMathStats {
  return {
    'positive-to-negative': { correct: 0, attempted: 0 },
    'negative-to-positive': { correct: 0, attempted: 0 },
  };
}

export function recordCountMathAnswer(
  stats: CountMathStats,
  transition: CountMathTransition,
  correct: boolean,
): CountMathStats {
  return {
    ...stats,
    [transition]: {
      correct: stats[transition].correct + (correct ? 1 : 0),
      attempted: stats[transition].attempted + 1,
    },
  };
}

export function progressiveCardCount(questionNumber: number, maximum: number): number {
  return Math.min(Math.max(1, maximum), 1 + Math.floor(Math.max(0, questionNumber - 1) / 3));
}
