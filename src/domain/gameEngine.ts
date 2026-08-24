import { type Card, type Rank, cardValue } from './cards';
import { type Shoe } from './shoe';
import { evaluateHand, isPair } from './hand';
import { getBasicStrategyAction } from './basicStrategy';

export type HandStatus = 'active' | 'stand' | 'bust' | 'blackjack';

export interface SeatHandState {
  /** e.g. "P1-A"; the letter suffix is only shown in the UI when a seat has multiple hands. */
  id: string;
  cards: Card[];
  fromSplit: boolean;
  isSplitAces: boolean;
  doubled: boolean;
  status: HandStatus;
}

export interface DealerHandState {
  cards: Card[];
  status: HandStatus;
}

export type DealTarget =
  | { type: 'player'; seatIndex: number; handId: string }
  | { type: 'dealer' };

export interface RoundEvent {
  kind: 'deal' | 'reveal';
  target: DealTarget;
  card: Card;
  /** Whether this card is visible to the learner (and thus counts) at this event. */
  visible: boolean;
}

export interface RoundOutput {
  events: RoundEvent[];
  seats: SeatHandState[][];
  dealer: DealerHandState;
  /** True once the shoe's cut card has been crossed as a result of this round's dealing. */
  cutCardCrossed: boolean;
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

function isPeekableUpcard(rank: Rank): boolean {
  return rank === 'A' || cardValue(rank) === 10;
}

function playSeat(
  seatIndex: number,
  initialCards: Card[],
  dealerUpcardRank: Rank,
  shoe: Shoe,
  events: RoundEvent[],
): SeatHandState[] {
  const finished: SeatHandState[] = [];
  let creationCount = 1; // letter 'A' is already used for the initial hand
  let totalHands = 1;

  function drawTo(hand: SeatHandState): Card {
    const card = shoe.draw();
    hand.cards.push(card);
    events.push({ kind: 'deal', target: { type: 'player', seatIndex, handId: hand.id }, card, visible: true });
    return card;
  }

  function resolveHand(hand: SeatHandState): void {
    if (!hand.fromSplit) {
      const natural = evaluateHand(hand.cards);
      if (natural.blackjack) {
        hand.status = 'blackjack';
        finished.push(hand);
        return;
      }
    }

    if (hand.isSplitAces) {
      hand.status = evaluateHand(hand.cards).busted ? 'bust' : 'stand';
      finished.push(hand);
      return;
    }

    for (;;) {
      const current = evaluateHand(hand.cards);
      if (current.busted) {
        hand.status = 'bust';
        finished.push(hand);
        return;
      }

      const canDouble = hand.cards.length === 2 && !hand.doubled;
      const canSplit = isPair(hand.cards) && totalHands < 4;
      const action = getBasicStrategyAction({
        cards: hand.cards,
        dealerUpcard: dealerUpcardRank,
        canDouble,
        canSplit,
        isSplitAces: false,
      });

      if (action === 'split') {
        totalHands += 1;
        const [c1, c2] = hand.cards;
        const isAceSplit = c1.rank === 'A';
        const letterA = letterFor(creationCount);
        creationCount += 1;
        const letterB = letterFor(creationCount);
        creationCount += 1;
        const handA: SeatHandState = {
          id: `P${seatIndex + 1}-${letterA}`,
          cards: [c1],
          fromSplit: true,
          isSplitAces: isAceSplit,
          doubled: false,
          status: 'active',
        };
        const handB: SeatHandState = {
          id: `P${seatIndex + 1}-${letterB}`,
          cards: [c2],
          fromSplit: true,
          isSplitAces: isAceSplit,
          doubled: false,
          status: 'active',
        };
        drawTo(handA);
        drawTo(handB);
        resolveHand(handA);
        resolveHand(handB);
        return;
      }

      if (action === 'double') {
        hand.doubled = true;
        drawTo(hand);
        const afterDouble = evaluateHand(hand.cards);
        hand.status = afterDouble.busted ? 'bust' : 'stand';
        finished.push(hand);
        return;
      }

      if (action === 'hit') {
        drawTo(hand);
        continue;
      }

      hand.status = 'stand';
      finished.push(hand);
      return;
    }
  }

  resolveHand({
    id: `P${seatIndex + 1}-A`,
    cards: initialCards,
    fromSplit: false,
    isSplitAces: false,
    doubled: false,
    status: 'active',
  });

  return finished;
}

/**
 * Plays one complete dealer round: initial deal, dealer peek, simulated
 * player turns (basic strategy), and dealer play (H17). Returns the ordered
 * sequence of dealing/reveal events alongside final hand states.
 */
export function playRound(shoe: Shoe, seatCount: number): RoundOutput {
  const events: RoundEvent[] = [];
  const seatInitialCards: Card[][] = Array.from({ length: seatCount }, () => []);
  const dealerCards: Card[] = [];

  function dealToSeat(seatIndex: number, cardsArr: Card[]) {
    const card = shoe.draw();
    cardsArr.push(card);
    events.push({ kind: 'deal', target: { type: 'player', seatIndex, handId: `P${seatIndex + 1}-A` }, card, visible: true });
  }

  // Standard order: one card to each player then the dealer, twice over.
  for (let round = 0; round < 2; round += 1) {
    for (let seatIndex = 0; seatIndex < seatCount; seatIndex += 1) {
      dealToSeat(seatIndex, seatInitialCards[seatIndex]);
    }
    const card = shoe.draw();
    dealerCards.push(card);
    events.push({ kind: 'deal', target: { type: 'dealer' }, card, visible: round === 0 });
  }

  const dealerUpcard = dealerCards[0];
  let holeRevealed = false;
  function revealHole() {
    if (holeRevealed) return;
    holeRevealed = true;
    events.push({ kind: 'reveal', target: { type: 'dealer' }, card: dealerCards[1], visible: true });
  }

  let dealerHasBlackjack = false;
  if (isPeekableUpcard(dealerUpcard.rank)) {
    const peek = evaluateHand(dealerCards);
    if (peek.blackjack) {
      dealerHasBlackjack = true;
      revealHole();
    }
  }

  const seats: SeatHandState[][] = [];
  for (let seatIndex = 0; seatIndex < seatCount; seatIndex += 1) {
    if (dealerHasBlackjack) {
      const initial = seatInitialCards[seatIndex];
      const ev = evaluateHand(initial);
      seats.push([
        {
          id: `P${seatIndex + 1}-A`,
          cards: initial,
          fromSplit: false,
          isSplitAces: false,
          doubled: false,
          status: ev.blackjack ? 'blackjack' : 'stand',
        },
      ]);
      continue;
    }
    seats.push(playSeat(seatIndex, seatInitialCards[seatIndex], dealerUpcard.rank, shoe, events));
  }

  if (!dealerHasBlackjack) {
    revealHole();
    let dealerEval = evaluateHand(dealerCards);
    while (!dealerEval.busted && (dealerEval.total < 17 || (dealerEval.total === 17 && dealerEval.soft))) {
      const card = shoe.draw();
      dealerCards.push(card);
      events.push({ kind: 'deal', target: { type: 'dealer' }, card, visible: true });
      dealerEval = evaluateHand(dealerCards);
    }
  }

  const finalDealerEval = evaluateHand(dealerCards);
  const dealer: DealerHandState = {
    cards: dealerCards,
    status: dealerHasBlackjack ? 'blackjack' : finalDealerEval.busted ? 'bust' : 'stand',
  };

  return { events, seats, dealer, cutCardCrossed: shoe.isPastCutCard() };
}
