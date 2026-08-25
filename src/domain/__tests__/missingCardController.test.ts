import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MissingCardController,
  type MissingCardDeckCount,
  type MissingCardSettings,
} from '../missingCardController';
import { speedToDelayMs } from '../session';

function settings(overrides: Partial<MissingCardSettings> = {}): MissingCardSettings {
  return { deckCount: 1, speed: 10, ...overrides };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('MissingCardController', () => {
  it.each([1, 2, 4, 6, 8] as MissingCardDeckCount[])(
    'sets aside exactly one card from a %i-deck shoe',
    (deckCount) => {
      const controller = new MissingCardController(settings({ deckCount }), () => {});
      expect(controller.getSnapshot().cardsToDeal).toBe(deckCount * 52 - 1);
      controller.destroy();
    },
  );

  it('shows every non-hidden card one at a time, then asks for a guess', () => {
    vi.useFakeTimers();
    const seenCardIds: string[] = [];
    let controller: MissingCardController;
    controller = new MissingCardController(settings(), () => {
      const card = controller.getSnapshot().currentCard;
      if (card) seenCardIds.push(card.id);
    });

    controller.start();
    vi.runAllTimers();

    expect(controller.getSnapshot().phase).toBe('guessing');
    expect(seenCardIds).toHaveLength(51);
    expect(new Set(seenCardIds)).toHaveLength(51);

    controller.submitGuess(0);
    const hiddenCard = controller.getSnapshot().result!.hiddenCard;
    expect(seenCardIds).not.toContain(hiddenCard.id);
  });

  it('pauses dealing, hides the current card, and resumes at the selected speed', () => {
    vi.useFakeTimers();
    const controller = new MissingCardController(settings(), () => {});
    controller.start();
    expect(controller.getSnapshot().cardsDealt).toBe(1);

    controller.pause();
    expect(controller.getSnapshot().phase).toBe('paused');
    expect(controller.getSnapshot().currentCard).toBeNull();
    vi.advanceTimersByTime(10_000);
    expect(controller.getSnapshot().cardsDealt).toBe(1);

    controller.resume();
    vi.advanceTimersByTime(speedToDelayMs(10));
    expect(controller.getSnapshot().phase).toBe('dealing');
    expect(controller.getSnapshot().cardsDealt).toBe(2);
    controller.destroy();
  });

  it('evaluates the hidden card using its Hi-Lo value', () => {
    vi.useFakeTimers();
    const controller = new MissingCardController(settings(), () => {}, () => 0);
    controller.start();
    vi.runAllTimers();
    controller.submitGuess(-1);

    const result = controller.getSnapshot().result!;
    expect(result.hiddenCard.rank).toBe('A');
    expect(result.correctValue).toBe(-1);
    expect(result.guessedValue).toBe(-1);
    expect(result.correct).toBe(true);
    expect(result.endedEarly).toBe(false);
  });

  it('ends early and reports progress without accepting a guess', () => {
    vi.useFakeTimers();
    const controller = new MissingCardController(settings({ deckCount: 2 }), () => {});
    controller.start();
    controller.endSession();

    const result = controller.getSnapshot().result!;
    expect(controller.getSnapshot().phase).toBe('result');
    expect(result.endedEarly).toBe(true);
    expect(result.guessedValue).toBeNull();
    expect(result.cardsDealt).toBe(1);
    expect(result.cardsToDeal).toBe(103);
  });
});
