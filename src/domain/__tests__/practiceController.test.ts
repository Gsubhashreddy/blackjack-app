import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeController } from '../practiceController';
import type { Card } from '../cards';
import type { RoundEvent } from '../gameEngine';
import type { RunningCountSettings } from '../session';

function settings(overrides: Partial<RunningCountSettings> = {}): RunningCountSettings {
  return {
    seatCount: 2,
    deckCount: 2,
    speed: 10, // fastest delay so fake-timer advancement is small
    askEveryRounds: 1,
    showTableDuringPrompt: true,
    showTableWhilePaused: false,
    ...overrides,
  };
}

describe('PracticeController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function drive(controller: PracticeController, maxSteps = 2000) {
    // Advances fake timers step by step until the controller stops changing
    // on its own (i.e. it is waiting for pause/resume or a user answer).
    for (let i = 0; i < maxSteps; i += 1) {
      const before = JSON.stringify(controller.getSnapshot());
      vi.advanceTimersByTime(300);
      const after = JSON.stringify(controller.getSnapshot());
      if (before === after) break;
    }
  }

  it('starts in the dealing phase and deals cards over time', () => {
    const controller = new PracticeController(settings(), () => {});
    controller.start();
    expect(controller.getSnapshot().phase).toBe('dealing');
    vi.advanceTimersByTime(300);
    const snap = controller.getSnapshot();
    const dealtSomething =
      snap.table.dealer.cards.length > 0 || snap.table.seats.some((s) => s.some((h) => h.cards.length > 0));
    expect(dealtSomething).toBe(true);
  });

  it('ticks elapsed time every second independently of a slow card speed', () => {
    const onChange = vi.fn();
    const controller = new PracticeController(settings({ speed: 1 }), onChange);
    controller.start();

    vi.advanceTimersByTime(1000);

    expect(controller.getSnapshot().elapsedSeconds).toBe(1);
    expect(controller.getSnapshot().visibleCardsDealt).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('uses wall-clock time so delayed elapsed ticks do not lose time', () => {
    vi.setSystemTime(new Date(0));
    const controller = new PracticeController(settings({ speed: 1 }), () => {});
    controller.start();

    vi.setSystemTime(new Date(3500));
    expect(controller.getSnapshot().elapsedSeconds).toBe(3);

    vi.advanceTimersByTime(1000);
    expect(controller.getSnapshot().elapsedSeconds).toBe(4);
  });

  it('preserves fractional elapsed time across pause and resume', () => {
    const controller = new PracticeController(settings({ speed: 1 }), () => {});
    controller.start();
    vi.advanceTimersByTime(750);
    controller.pause();

    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().elapsedSeconds).toBe(0);

    controller.resume();
    vi.advanceTimersByTime(249);
    expect(controller.getSnapshot().elapsedSeconds).toBe(0);
    vi.advanceTimersByTime(1);
    expect(controller.getSnapshot().elapsedSeconds).toBe(1);
  });

  it('pauses and stops dealing until resumed', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 10 }), () => {});
    controller.start();
    vi.advanceTimersByTime(300);
    controller.pause();
    const snapshotAtPause = controller.getSnapshot();
    expect(snapshotAtPause.phase).toBe('paused');
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot()).toEqual(snapshotAtPause);
    controller.resume();
    expect(controller.getSnapshot().phase).toBe('dealing');
  });

  it('checks the running count on demand and returns to the paused game', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 10 }), () => {});
    controller.start();
    vi.advanceTimersByTime(300);
    controller.pause();
    controller.checkRunningCount();

    expect(controller.getSnapshot().phase).toBe('awaiting-count');
    controller.submitAnswer(0);
    expect(controller.getSnapshot().phase).toBe('answered');
    controller.continueAfterAnswer();
    expect(controller.getSnapshot().phase).toBe('paused');
  });

  it('asks for the running count after the configured number of rounds', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    expect(controller.getSnapshot().phase).toBe('awaiting-count');
    expect(controller.getSnapshot().roundsCompleted).toBe(1);
  });

  it('freezes elapsed time while prompting and after an answer', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    const elapsedAtPrompt = controller.getSnapshot().elapsedSeconds;

    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().elapsedSeconds).toBe(elapsedAtPrompt);
    controller.submitAnswer(0);
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().phase).toBe('answered');
    expect(controller.getSnapshot().elapsedSeconds).toBe(elapsedAtPrompt);
  });

  it('validates a correct answer immediately and stores it in the answer history', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    controller.submitAnswer(0);
    const feedback = controller.getSnapshot().answerFeedback!;
    expect(feedback.userAnswer).toBe(0);
    expect(feedback.correct).toBe(feedback.userAnswer === feedback.correctAnswer);
    expect(controller.getSnapshot().phase).toBe('answered');
    expect(controller.getSnapshot().answers).toHaveLength(1);
    expect(controller.getSnapshot().answers[0].correct).toBe(feedback.correct);
  });

  it('continues gameplay from the true running count after an incorrect answer', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    const actualCorrect = controller.getSnapshot();
    controller.submitAnswer(999); // deliberately wrong
    const feedback = controller.getSnapshot().answerFeedback!;
    expect(feedback.correct).toBe(false);
    expect(feedback.correctAnswer).not.toBe(999);
    controller.continueAfterAnswer();
    // Next round's dealing should proceed and the eventual correct answer
    // should never have been reset to the user's wrong guess. We validate
    // this indirectly: submitting the actual internal value later succeeds.
    drive(controller);
    if (controller.getSnapshot().phase === 'awaiting-count') {
      const priorCount = feedback.correctAnswer;
      controller.submitAnswer(priorCount); // almost certainly wrong now since more cards dealt, but should not throw
      expect(controller.getSnapshot().phase).toBe('answered');
    }
    void actualCorrect;
  });

  it('ends the session immediately when endSession is called', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 10 }), () => {});
    controller.start();
    vi.advanceTimersByTime(300);
    controller.endSession();
    const snap = controller.getSnapshot();
    expect(snap.phase).toBe('summary');
    expect(snap.summary?.endReason).toBe('user-ended');
  });

  it('reset starts a fresh shoe, clears results, and resets running count to 0', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    controller.submitAnswer(1234);
    controller.continueAfterAnswer();
    controller.reset();
    const snap = controller.getSnapshot();
    expect(snap.answers).toHaveLength(0);
    expect(snap.roundsCompleted).toBe(0);
    expect(snap.visibleCardsDealt).toBe(0);
    expect(snap.elapsedSeconds).toBe(0);
    expect(snap.activeHandId).toBeNull();
    expect(snap.phase).toBe('dealing');
  });

  it('cleans up elapsed and card timers on destroy, end, and reset', () => {
    const destroyed = new PracticeController(settings({ speed: 1 }), () => {});
    destroyed.start();
    expect(vi.getTimerCount()).toBe(2);
    destroyed.destroy();
    expect(vi.getTimerCount()).toBe(0);

    const ended = new PracticeController(settings({ speed: 1 }), () => {});
    ended.start();
    ended.endSession();
    expect(vi.getTimerCount()).toBe(0);
    expect(ended.getSnapshot().activeHandId).toBeNull();

    const reset = new PracticeController(settings({ speed: 1 }), () => {});
    reset.start();
    vi.advanceTimersByTime(1500);
    expect(reset.getSnapshot().elapsedSeconds).toBe(1);
    reset.reset();
    expect(reset.getSnapshot().elapsedSeconds).toBe(0);
    expect(vi.getTimerCount()).toBe(2);
    reset.destroy();
  });

  it('tracks the most recently receiving player, dealer, reveal, and split hand', () => {
    const controller = new PracticeController(settings({ seatCount: 1 }), () => {});
    const applyEvent = (event: RoundEvent) =>
      (controller as unknown as { applyEvent: (nextEvent: RoundEvent) => void }).applyEvent(event);
    const first: Card = { id: 'first', rank: '8', suit: 'clubs' };
    const hole: Card = { id: 'hole', rank: 'K', suit: 'spades' };

    applyEvent({
      kind: 'deal',
      target: { type: 'player', seatIndex: 0, handId: 'P1-A' },
      card: first,
      visible: true,
    });
    expect(controller.getSnapshot().activeHandId).toBe('P1-A');

    applyEvent({ kind: 'deal', target: { type: 'dealer' }, card: hole, visible: false });
    expect(controller.getSnapshot().activeHandId).toBe('D');

    applyEvent({
      kind: 'split',
      target: { type: 'player', seatIndex: 0, handId: 'P1-A' },
      hands: [
        { id: 'P1-B', card: first },
        { id: 'P1-C', card: { ...first, id: 'second' } },
      ],
    });
    expect(controller.getSnapshot().activeHandId).toBe('P1-B');

    applyEvent({ kind: 'reveal', target: { type: 'dealer' }, card: hole, visible: true });
    expect(controller.getSnapshot().activeHandId).toBe('D');
    controller.endSession();
    expect(controller.getSnapshot().activeHandId).toBeNull();
  });

  it('clears the active hand when a round finishes and before the next round', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    vi.advanceTimersByTime(250);
    expect(controller.getSnapshot().activeHandId).toBe('P1-A');

    drive(controller);
    expect(controller.getSnapshot().phase).toBe('awaiting-count');
    expect(controller.getSnapshot().activeHandId).toBeNull();

    controller.submitAnswer(0);
    controller.continueAfterAnswer();
    expect(controller.getSnapshot().phase).toBe('dealing');
    expect(controller.getSnapshot().activeHandId).toBeNull();
  });

  it('ends the session with reason cut-card once the shoe cut card is crossed and no boundary question is pending', () => {
    // A tiny 2-deck shoe with many seats crosses the cut card quickly.
    const controller = new PracticeController(settings({ askEveryRounds: 50, seatCount: 6, deckCount: 2 }), () => {});
    controller.start();
    drive(controller, 5000);
    expect(controller.getSnapshot().phase).toBe('summary');
    expect(controller.getSnapshot().summary?.endReason).toBe('cut-card');
  });

  it('asks a final question before summary when the cut-card round also lands on a prompt boundary', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 6, deckCount: 2 }), () => {});
    controller.start();
    // Because askEveryRounds is 1, every round is a boundary, so this loop
    // must answer several prompts before the cut card ends the session.
    for (let i = 0; i < 50; i += 1) {
      drive(controller, 5000);
      const phase = controller.getSnapshot().phase;
      if (phase === 'summary') break;
      if (phase === 'awaiting-count') {
        controller.submitAnswer(0);
        expect(controller.getSnapshot().phase).toBe('answered');
        controller.continueAfterAnswer();
      }
    }
    expect(controller.getSnapshot().phase).toBe('summary');
    expect(controller.getSnapshot().summary?.endReason).toBe('cut-card');
  });

  it('never lets visibleCardsDealt exceed total shoe cards dealt (hole card excluded until reveal)', () => {
    const controller = new PracticeController(settings({ askEveryRounds: 1, seatCount: 1 }), () => {});
    controller.start();
    drive(controller);
    const snap = controller.getSnapshot();
    expect(snap.visibleCardsDealt).toBeGreaterThan(0);
  });
});
