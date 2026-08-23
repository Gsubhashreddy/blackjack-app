import type { TableHand } from '../domain/practiceController';
import { evaluateHand } from '../domain/hand';
import { PlayingCard } from './PlayingCard';

export interface HandDisplayProps {
  hand: TableHand;
  label: string;
}

const STATUS_LABEL: Record<string, string> = {
  bust: 'Bust',
  blackjack: 'Blackjack',
  stand: '',
  active: '',
};

export function HandDisplay({ hand, label }: HandDisplayProps) {
  const faceUpCards = hand.cards.filter((c) => c.faceUp).map((c) => c.card);
  const { total } = evaluateHand(faceUpCards);
  const hasFaceDown = hand.cards.some((c) => !c.faceUp);
  const statusLabel = STATUS_LABEL[hand.status] ?? '';

  return (
    <div className="hand" data-status={hand.status}>
      <div className="hand-label">{label}</div>
      <div className="hand-cards">
        {hand.cards.map((c, i) => (
          <PlayingCard
            key={c.card.id}
            rank={c.card.rank}
            suit={c.card.suit}
            faceUp={c.faceUp}
            overlapOffset={i === 0 ? 0 : 22}
          />
        ))}
        {hand.cards.length === 0 && <div className="hand-cards-placeholder" />}
      </div>
      <div className="hand-total-row">
        {hand.cards.length > 0 && (
          <span className="hand-total" aria-label={`Total ${total}${hasFaceDown ? ' plus hidden card' : ''}`}>
            {total}
            {hasFaceDown ? '+' : ''}
          </span>
        )}
        {statusLabel && <span className="hand-status">{statusLabel}</span>}
      </div>
    </div>
  );
}
