import { useState, type CSSProperties } from 'react';

/**
 * Card thickness (px) used to draw the stack inside a tray.
 * Kept in sync with the tray dimensions in index.css so a full 8-deck shoe fills the tray.
 */
const CARD_THICKNESS_PX = { normal: 0.3, small: 0.17 } as const;

/** Degrees added to the tray rotation per arrow press. */
export const ROTATION_STEP_DEG = 30;

/** Starting three-quarter view, matching how a discard tray sits on a table. */
const DEFAULT_ROTATION_DEG = -24;

/** Downward tilt, as if looking at a tray standing on the table in front of you. */
const TILT_DEG = -14;

export interface CardTrayProps {
  /** Number of physical cards sitting in the tray. */
  cardCount: number;
  /** Caption rendered under the tray, e.g. "1 deck". */
  caption?: string;
  /** Accessible description; defaults to a neutral label that avoids revealing the answer. */
  label?: string;
  /** Enables hover/focus magnification. */
  zoomable?: boolean;
  /** Shows the ← / → buttons that spin the tray around its vertical axis. */
  rotatable?: boolean;
  size?: 'normal' | 'small';
}

/**
 * Perspective view of a clear discard tray. The stack of card edges grows taller with the
 * number of cards, and the tray can be rotated so the stack can be judged from any angle.
 */
export function CardTray({
  cardCount,
  caption,
  label,
  zoomable = false,
  rotatable = false,
  size = 'normal',
}: CardTrayProps) {
  const [rotation, setRotation] = useState(DEFAULT_ROTATION_DEG);

  const thickness = CARD_THICKNESS_PX[size];
  const stackHeightPx = Math.max(0, cardCount) * thickness;
  const classNames = ['card-tray', `card-tray-${size}`, zoomable ? 'card-tray-zoomable' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <figure className={classNames}>
      <div
        className="card-tray-viewport"
        tabIndex={zoomable ? 0 : undefined}
        role="img"
        aria-label={label ?? 'Tray of cards'}
        style={{ '--card-thickness': `${thickness}px` } as CSSProperties}
      >
        <div className="card-tray-scene">
          <div
            className="card-tray-box"
            style={{ transform: `rotateX(${TILT_DEG}deg) rotateY(${rotation}deg)` }}
          >
            <div className="tray-face tray-wall tray-wall-back" />
            <div className="tray-face tray-wall tray-wall-left" />
            <div className="tray-face tray-wall tray-wall-right" />
            <div className="tray-face tray-bottom" />
            {stackHeightPx > 0 && (
              <div
                className="card-tray-stack"
                style={{ '--stack-height': `${stackHeightPx}px` } as CSSProperties}
              >
                <div className="stack-face stack-top" />
                <div className="stack-face stack-front" />
                <div className="stack-face stack-back" />
                <div className="stack-face stack-left" />
                <div className="stack-face stack-right" />
              </div>
            )}
            <div className="tray-face tray-wall tray-wall-front" />
          </div>
        </div>
      </div>
      {rotatable && (
        <div className="card-tray-controls">
          <button
            type="button"
            className="secondary-button card-tray-rotate"
            aria-label="Rotate tray left"
            onClick={() => setRotation((current) => current - ROTATION_STEP_DEG)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="secondary-button card-tray-rotate"
            aria-label="Rotate tray right"
            onClick={() => setRotation((current) => current + ROTATION_STEP_DEG)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
