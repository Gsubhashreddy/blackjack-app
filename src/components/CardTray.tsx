/** Card edge width (px) used to draw a tray. Kept in sync with `--tray-card-width` in index.css. */
const CARD_EDGE_PX = 1.15;

export interface CardTrayProps {
  /** Number of physical cards sitting in the tray. */
  cardCount: number;
  /** Caption rendered under the tray, e.g. "1 deck". */
  caption?: string;
  /** Accessible description; defaults to a neutral label that avoids revealing the answer. */
  label?: string;
  /** Enables hover/focus magnification. */
  zoomable?: boolean;
  size?: 'normal' | 'small';
}

/**
 * Side view of a discard tray. The stack width grows with the number of cards and
 * each card edge is drawn as its own stripe, so a magnified tray stays countable.
 */
export function CardTray({
  cardCount,
  caption,
  label,
  zoomable = false,
  size = 'normal',
}: CardTrayProps) {
  const widthPx = Math.max(CARD_EDGE_PX, cardCount * CARD_EDGE_PX);
  const classNames = [
    'card-tray',
    `card-tray-${size}`,
    zoomable ? 'card-tray-zoomable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure
      className={classNames}
      tabIndex={zoomable ? 0 : undefined}
      role="img"
      aria-label={label ?? 'Tray of cards'}
    >
      <div className="card-tray-viewport">
        <div className="card-tray-body">
          <div className="card-tray-stack" style={{ width: `${widthPx}px` }} />
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
