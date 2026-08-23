import type { Rank, Suit } from '../domain/cards';

const SUIT_SYMBOLS: Record<Suit, string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
};

const RED_SUITS: Suit[] = ['diamonds', 'hearts'];

export interface PlayingCardProps {
  rank?: Rank;
  suit?: Suit;
  faceUp: boolean;
  /** Horizontal overlap offset in pixels, applied via negative margin-left. */
  overlapOffset?: number;
}

export function PlayingCard({ rank, suit, faceUp, overlapOffset = 0 }: PlayingCardProps) {
  const isRed = suit ? RED_SUITS.includes(suit) : false;
  return (
    <div
      className={`playing-card ${faceUp ? 'face-up' : 'face-down'} ${isRed ? 'red' : ''}`}
      style={overlapOffset ? { marginLeft: -overlapOffset } : undefined}
      aria-hidden={!faceUp}
    >
      {faceUp && rank && suit ? (
        <>
          <span className="card-rank">{rank}</span>
          <span className="card-suit">{SUIT_SYMBOLS[suit]}</span>
        </>
      ) : (
        <span className="card-back" aria-hidden="true" />
      )}
    </div>
  );
}
