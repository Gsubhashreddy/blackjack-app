import type { HandStatus, SeatHandState } from './gameEngine';

export type DeckCount = 2 | 4 | 6 | 8;

export interface RunningCountSettings {
  seatCount: number; // 1-6
  deckCount: DeckCount;
  speed: number; // 1-10
  askEveryRounds: number; // 1-10
  showTableDuringPrompt: boolean;
}

export const DEFAULT_SETTINGS: RunningCountSettings = {
  seatCount: 3,
  deckCount: 6,
  speed: 5,
  askEveryRounds: 3,
  showTableDuringPrompt: true,
};

/**
 * Maps the 1-10 speed slider to a delay (ms) between individual cards.
 * Anchors: speed 1 -> 2000ms, speed 5 -> 1000ms, speed 10 -> 250ms.
 * Smoothly interpolated (piecewise-linear) between the anchors.
 */
export function speedToDelayMs(speed: number): number {
  const clamped = Math.min(10, Math.max(1, speed));
  if (clamped <= 5) {
    // 1 -> 2000, 5 -> 1000
    const t = (clamped - 1) / (5 - 1);
    return 2000 + t * (1000 - 2000);
  }
  // 5 -> 1000, 10 -> 250
  const t = (clamped - 5) / (10 - 5);
  return 1000 + t * (250 - 1000);
}

export type EndReason = 'cut-card' | 'user-ended';

export interface AnswerRecord {
  roundNumber: number;
  userAnswer: number;
  correctAnswer: number;
  correct: boolean;
}

export interface SessionSummary {
  endReason: EndReason;
  deckCount: DeckCount;
  seatCount: number;
  roundsCompleted: number;
  visibleCardsDealt: number;
  questionsAsked: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercent: number;
  finalRunningCount: number;
  answers: AnswerRecord[];
}

export interface DisplaySeatHand extends SeatHandState {
  total: number;
}

export interface DisplayDealerHand {
  cards: SeatHandState['cards'];
  status: HandStatus;
  total: number;
  holeRevealed: boolean;
}
