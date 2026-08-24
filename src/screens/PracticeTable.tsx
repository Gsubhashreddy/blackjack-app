import { useEffect, useState } from 'react';
import type { RunningCountSettings } from '../domain/session';
import { usePracticeController } from '../hooks/usePracticeController';
import { HandDisplay } from '../components/HandDisplay';
import { CountPrompt } from '../components/CountPrompt';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { SessionSummary } from '../domain/session';

export interface PracticeTableProps {
  settings: RunningCountSettings;
  onEnd: (summary: SessionSummary) => void;
}

function seatLabel(seatIndex: number, hand: { id: string }, hasMultipleHands: boolean): string {
  if (!hasMultipleHands) return `Player ${seatIndex + 1}`;
  const letter = hand.id.split('-')[1] ?? '';
  return `Player ${seatIndex + 1}-${letter}`;
}

export function PracticeTable({ settings, onEnd }: PracticeTableProps) {
  const { snapshot, controller } = usePracticeController(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (snapshot?.phase === 'summary' && snapshot.summary) {
      onEnd(snapshot.summary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.phase]);

  if (!snapshot || !controller) {
    return (
      <main className="screen practice-screen">
        <p>Loading…</p>
      </main>
    );
  }

  if (snapshot.phase === 'summary') {
    return null;
  }

  const isPaused = snapshot.phase === 'paused';
  const showPrompt = snapshot.phase === 'awaiting-count' || snapshot.phase === 'answered';
  const hideTableBehindPrompt = showPrompt && !settings.showTableDuringPrompt;

  return (
    <main className="screen practice-screen">
      <div className="session-progress" aria-live="polite">
        <span>Round {snapshot.roundsCompleted + (snapshot.phase === 'dealing' ? 1 : 0)}</span>
        <span>Cards dealt: {snapshot.visibleCardsDealt}</span>
        <span>Shoe: {Math.round(snapshot.shoeProgress * 100)}%</span>
      </div>

      {isPaused ? (
        <div className="paused-panel" role="status">
          <p>Session paused. Table hidden.</p>
        </div>
      ) : hideTableBehindPrompt ? (
        <div className="paused-panel" role="status">
          <p>Table hidden during count prompt.</p>
        </div>
      ) : (
        <div className="table-felt">
          <div className="dealer-row">
            <HandDisplay hand={snapshot.table.dealer} label="Dealer" />
          </div>
          <div className="seats-row">
            {snapshot.table.seats.map((seatHands, seatIndex) => (
              <div className="seat" key={seatIndex}>
                {seatHands.map((hand) => (
                  <HandDisplay key={hand.id} hand={hand} label={seatLabel(seatIndex, hand, seatHands.length > 1)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-controls">
        <button
          type="button"
          className="secondary-button"
          onClick={() => (isPaused ? controller.resume() : controller.pause())}
          disabled={showPrompt}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="secondary-button" onClick={() => setShowResetConfirm(true)}>
          Reset
        </button>
        <button type="button" className="danger-button" onClick={() => controller.endSession()}>
          End Session
        </button>
      </div>

      <CountPrompt
        visible={showPrompt}
        feedback={snapshot.answerFeedback}
        onSubmit={(v) => controller.submitAnswer(v)}
        onContinue={() => controller.continueAfterAnswer()}
      />

      <ConfirmDialog
        open={showResetConfirm}
        message="Reset this session? Current results will be deleted."
        confirmLabel="Reset"
        onConfirm={() => {
          setShowResetConfirm(false);
          controller.reset();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </main>
  );
}
