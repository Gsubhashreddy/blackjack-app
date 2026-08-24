import type { Card } from './cards';
import { Shoe } from './shoe';
import { RunningCount } from './count';
import { playRound, type RoundEvent, type RoundOutput, type HandStatus } from './gameEngine';
import { type RunningCountSettings, type AnswerRecord, type SessionSummary, type EndReason, speedToDelayMs } from './session';

export interface TableCard {
  card: Card;
  faceUp: boolean;
}

export interface TableHand {
  id: string;
  cards: TableCard[];
  status: HandStatus;
}

export interface TableState {
  seats: TableHand[][];
  dealer: TableHand;
}

export type Phase = 'dealing' | 'paused' | 'awaiting-count' | 'answered' | 'summary';

export interface AnswerFeedback {
  correct: boolean;
  correctAnswer: number;
  userAnswer: number;
}

export interface PracticeSnapshot {
  phase: Phase;
  table: TableState;
  roundsCompleted: number;
  visibleCardsDealt: number;
  shoeProgress: number;
  answers: AnswerRecord[];
  answerFeedback: AnswerFeedback | null;
  summary: SessionSummary | null;
  settings: RunningCountSettings;
}

function emptyTable(seatCount: number): TableState {
  return {
    seats: Array.from({ length: seatCount }, (_, i) => [
      { id: `P${i + 1}-A`, cards: [], status: 'active' as HandStatus },
    ]),
    dealer: { id: 'D', cards: [], status: 'active' },
  };
}

function findOrCreateHand(seatHands: TableHand[], handId: string): TableHand {
  let hand = seatHands.find((h) => h.id === handId);
  if (!hand) {
    hand = { id: handId, cards: [], status: 'active' };
    seatHands.push(hand);
  }
  return hand;
}

/**
 * Owns the entire lifecycle of a running-count practice session: the shoe,
 * the Hi-Lo running count, card-by-card animation timing, round/prompt
 * bookkeeping, and cut-card end-of-session behavior. Kept free of React so
 * it can be exercised directly in unit tests with fake timers.
 */
export class PracticeController {
  private settings: RunningCountSettings;
  private shoe: Shoe;
  private count = new RunningCount();
  private phase: Phase = 'dealing';
  private table: TableState;
  private roundsCompleted = 0;
  private visibleCardsDealt = 0;
  private answers: AnswerRecord[] = [];
  private answerFeedback: AnswerFeedback | null = null;
  private summary: SessionSummary | null = null;
  private roundEvents: RoundEvent[] = [];
  private roundEventIndex = 0;
  private roundOutput: RoundOutput | null = null;
  private pendingCutCardEnd = false;
  private ended = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onChange: () => void;

  constructor(settings: RunningCountSettings, onChange: () => void) {
    this.settings = settings;
    this.onChange = onChange;
    this.shoe = new Shoe({ deckCount: settings.deckCount });
    this.table = emptyTable(settings.seatCount);
  }

  getSnapshot(): PracticeSnapshot {
    return {
      phase: this.phase,
      table: this.table,
      roundsCompleted: this.roundsCompleted,
      visibleCardsDealt: this.visibleCardsDealt,
      shoeProgress: this.shoe.progress(),
      answers: this.answers,
      answerFeedback: this.answerFeedback,
      summary: this.summary,
      settings: this.settings,
    };
  }

  start(): void {
    this.startNextRound();
  }

  destroy(): void {
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private startNextRound() {
    if (this.ended) return;
    const output = playRound(this.shoe, this.settings.seatCount);
    this.roundOutput = output;
    this.roundEvents = output.events;
    this.roundEventIndex = 0;
    this.table = emptyTable(this.settings.seatCount);
    this.phase = 'dealing';
    this.clearTimer();
    this.scheduleNextStep();
    this.onChange();
  }

  private scheduleNextStep() {
    this.timer = setTimeout(() => this.stepEvent(), speedToDelayMs(this.settings.speed));
  }

  private stepEvent() {
    if (this.ended || this.phase === 'paused') return;
    const idx = this.roundEventIndex;
    if (idx >= this.roundEvents.length) {
      this.finishRound();
      return;
    }
    const event = this.roundEvents[idx];
    this.roundEventIndex = idx + 1;
    this.applyEvent(event);
    this.scheduleNextStep();
    this.onChange();
  }

  private applyEvent(event: RoundEvent) {
    if (event.target.type === 'dealer') {
      if (event.kind === 'deal') {
        this.table = {
          ...this.table,
          dealer: { ...this.table.dealer, cards: [...this.table.dealer.cards, { card: event.card, faceUp: event.visible }] },
        };
        if (event.visible) {
          this.count.addCard(event.card);
          this.visibleCardsDealt += 1;
        }
      } else {
        this.table = {
          ...this.table,
          dealer: {
            ...this.table.dealer,
            cards: this.table.dealer.cards.map((c) => (c.card.id === event.card.id ? { ...c, faceUp: true } : c)),
          },
        };
        this.count.addCard(event.card);
        this.visibleCardsDealt += 1;
      }
      return;
    }

    const { seatIndex, handId } = event.target;
    const seats = this.table.seats.map((seatHands, i) => {
      if (i !== seatIndex) return seatHands;
      const cloned = seatHands.map((h) => ({ ...h, cards: [...h.cards] }));
      const hand = findOrCreateHand(cloned, handId);
      hand.cards.push({ card: event.card, faceUp: true });
      return cloned;
    });
    this.table = { ...this.table, seats };
    this.count.addCard(event.card);
    this.visibleCardsDealt += 1;
  }

  private applyFinalStatuses() {
    const output = this.roundOutput;
    if (!output) return;
    this.table = {
      seats: this.table.seats.map((seatHands, seatIndex) =>
        seatHands.map((hand) => {
          const finalHand = output.seats[seatIndex].find((h) => h.id === hand.id);
          return finalHand ? { ...hand, status: finalHand.status } : hand;
        }),
      ),
      dealer: { ...this.table.dealer, status: output.dealer.status },
    };
  }

  private finishRound() {
    const output = this.roundOutput;
    if (!output) return;
    this.applyFinalStatuses();
    this.roundsCompleted += 1;
    this.pendingCutCardEnd = output.cutCardCrossed;

    const isPromptBoundary = this.roundsCompleted % this.settings.askEveryRounds === 0;

    if (this.pendingCutCardEnd) {
      if (isPromptBoundary) {
        this.phase = 'awaiting-count';
        this.onChange();
      } else {
        this.endSessionInternal('cut-card');
      }
      return;
    }

    if (isPromptBoundary) {
      this.phase = 'awaiting-count';
      this.onChange();
      return;
    }

    this.startNextRound();
  }

  private buildSummary(endReason: EndReason): SessionSummary {
    const correctAnswers = this.answers.filter((a) => a.correct).length;
    const incorrectAnswers = this.answers.length - correctAnswers;
    return {
      endReason,
      deckCount: this.settings.deckCount,
      seatCount: this.settings.seatCount,
      roundsCompleted: this.roundsCompleted,
      visibleCardsDealt: this.visibleCardsDealt,
      questionsAsked: this.answers.length,
      correctAnswers,
      incorrectAnswers,
      accuracyPercent: this.answers.length > 0 ? Math.round((correctAnswers / this.answers.length) * 1000) / 10 : 0,
      finalRunningCount: this.count.value(),
      answers: this.answers,
    };
  }

  private endSessionInternal(endReason: EndReason) {
    this.ended = true;
    this.clearTimer();
    this.summary = this.buildSummary(endReason);
    this.phase = 'summary';
    this.onChange();
  }

  pause(): void {
    if (this.phase === 'summary' || this.ended) return;
    this.clearTimer();
    this.phase = 'paused';
    this.onChange();
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'dealing';
    this.scheduleNextStep();
    this.onChange();
  }

  reset(): void {
    this.clearTimer();
    this.ended = false;
    this.pendingCutCardEnd = false;
    this.roundsCompleted = 0;
    this.visibleCardsDealt = 0;
    this.shoe = new Shoe({ deckCount: this.settings.deckCount });
    this.count = new RunningCount();
    this.answers = [];
    this.answerFeedback = null;
    this.summary = null;
    this.startNextRound();
  }

  endSession(): void {
    if (this.phase === 'summary' || this.ended) return;
    this.endSessionInternal('user-ended');
  }

  submitAnswer(userAnswer: number): void {
    if (this.phase !== 'awaiting-count') return;
    const correctAnswer = this.count.value();
    const correct = userAnswer === correctAnswer;
    const record: AnswerRecord = { roundNumber: this.roundsCompleted, userAnswer, correctAnswer, correct };
    this.answers = [...this.answers, record];
    this.answerFeedback = { correct, correctAnswer, userAnswer };
    this.phase = 'answered';
    this.onChange();
  }

  continueAfterAnswer(): void {
    if (this.phase !== 'answered') return;
    this.answerFeedback = null;
    if (this.pendingCutCardEnd) {
      this.endSessionInternal('cut-card');
      return;
    }
    this.startNextRound();
  }
}
