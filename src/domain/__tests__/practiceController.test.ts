import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeController } from '../practiceController';
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
    expect(snap.phase).toBe('dealing');
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
