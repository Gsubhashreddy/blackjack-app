import { useEffect, useState } from 'react';
import type { RunningCountSettings } from '../domain/session';
import { usePracticeController } from '../hooks/usePracticeController';
import { HandDisplay } from '../components/HandDisplay';
import { CountPrompt } from '../components/CountPrompt';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { SessionSummary } from '../domain/session';
import type { TableHand } from '../domain/practiceController';

export interface PracticeTableProps {
  settings: RunningCountSettings;
  onEnd: (summary: SessionSummary) => void;
}

export function PlayerSeats({ seats }: { seats: TableHand[][] }) {
  return (
    <div className="seats-row">
      {seats.map((seatHands, seatIndex) => {
        const hasMultipleHands = seatHands.length > 1;
        return (
          <div className={`seat ${hasMultipleHands ? 'seat-split' : ''}`} key={seatIndex}>
            <div className="seat-label">Player {seatIndex + 1}</div>
            <div className={`seat-hands ${hasMultipleHands ? 'seat-hands-scrollable' : ''}`}>
              {seatHands.map((hand, handIndex) => (
                <HandDisplay key={hand.id} hand={hand} label={hasMultipleHands ? `Hand ${handIndex + 1}` : undefined} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PracticeTable({ settings, onEnd }: PracticeTableProps) {
  const { snapshot, controller } = usePracticeController(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [tableVisibility, setTableVisibility] = useState({
    showTableWhilePaused: settings.showTableWhilePaused,
    showTableDuringPrompt: settings.showTableDuringPrompt,
  });

  useEffect(() => {
    if (snapshot?.phase === 'summary' && snapshot.summary) {
      onEnd(snapshot.summary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.phase]);

  if (!snapshot || !controller) {
    return (
      <main className="screen practice-screen running-count-screen">
        <p>Loading…</p>
      </main>
    );
  }

  if (snapshot.phase === 'summary') {
    return null;
  }

  const isPaused = snapshot.phase === 'paused';
  const showPrompt = snapshot.phase === 'awaiting-count' || snapshot.phase === 'answered';
  const hideTableWhilePaused = isPaused && !tableVisibility.showTableWhilePaused;
  const hideTableBehindPrompt = showPrompt && !tableVisibility.showTableDuringPrompt;

  return (
    <main className="screen practice-screen running-count-screen">
      <p className="orientation-hint" role="status">
        Rotate your device for the full table view
      </p>
      <div className="session-progress" aria-live="polite">
        <div className="session-progress-details">
          <span>Round {snapshot.roundsCompleted + (snapshot.phase === 'dealing' ? 1 : 0)}</span>
          <span>Cards dealt: {snapshot.visibleCardsDealt}</span>
          <span>Shoe: {Math.round(snapshot.shoeProgress * 100)}%</span>
        </div>
        <div className="table-top-actions">
          <button
            type="button"
            className="table-icon-button"
            aria-label={isPaused ? 'Resume' : 'Pause'}
            onClick={() => (isPaused ? controller.resume() : controller.pause())}
            disabled={showPrompt}
          >
            <span aria-hidden="true">{isPaused ? '▶' : 'Ⅱ'}</span>
          </button>
          <button
            type="button"
            className="table-icon-button settings-button"
            aria-label="Table visibility settings"
            aria-expanded={showTableSettings}
            onClick={() => setShowTableSettings(true)}
            disabled={showPrompt}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>
      </div>

      {hideTableWhilePaused ? (
        <div className="paused-panel" role="status">
          <p>Session paused. Table hidden.</p>
        </div>
      ) : hideTableBehindPrompt ? (
        <div className="paused-panel" role="status">
          <p>Table hidden during count prompt.</p>
        </div>
      ) : (
        <div className="table-felt running-count-table">
          <div className="dealer-row">
            <HandDisplay hand={snapshot.table.dealer} label="Dealer" />
          </div>
          <div className="table-markings" aria-hidden="true">
            <strong>BLACKJACK PAYS 3 TO 2</strong>
            <span>Dealer stands on 17</span>
          </div>
          <PlayerSeats seats={snapshot.table.seats} />
        </div>
      )}

      {isPaused && !showResetConfirm && !showTableSettings && (
        <div className="pause-menu-layer">
          <section className="pause-menu" role="dialog" aria-labelledby="pause-menu-title">
            <h2 id="pause-menu-title">Game paused</h2>
            <button type="button" className="primary-button" onClick={() => controller.resume()}>
              Resume
            </button>
            <button type="button" className="secondary-button" onClick={() => controller.checkRunningCount()}>
              Check running count
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowResetConfirm(true)}>
              Reset session
            </button>
            <button type="button" className="danger-button" onClick={() => controller.endSession()}>
              End session
            </button>
          </section>
        </div>
      )}

      {showTableSettings && (
        <div className="modal-overlay" role="presentation">
          <div className="modal table-settings" role="dialog" aria-modal="true" aria-labelledby="table-settings-title">
            <h2 id="table-settings-title">Table visibility</h2>
            <label className="field field-toggle">
              <span>Show table while paused</span>
              <input
                type="checkbox"
                checked={tableVisibility.showTableWhilePaused}
                onChange={(e) =>
                  setTableVisibility((current) => ({ ...current, showTableWhilePaused: e.target.checked }))
                }
              />
            </label>
            <label className="field field-toggle">
              <span>Show table during count prompt</span>
              <input
                type="checkbox"
                checked={tableVisibility.showTableDuringPrompt}
                onChange={(e) =>
                  setTableVisibility((current) => ({ ...current, showTableDuringPrompt: e.target.checked }))
                }
              />
            </label>
            <button type="button" className="primary-button" onClick={() => setShowTableSettings(false)}>
              Done
            </button>
          </div>
        </div>
      )}

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
