import { describe, expect, it, vi } from 'vitest';
import { Shoe } from '../shoe';
import { playRound } from '../gameEngine';
import { evaluateHand } from '../hand';
import { hiLoValue, type Card, type Rank } from '../cards';

function newShoe(deckCount: 2 | 4 | 6 | 8 = 6, seed = 1) {
  let s = seed;
  const rng = () => {
    // simple deterministic LCG so tests are stable but still exercise shuffle
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return new Shoe({ deckCount, rng, penetration: 0.75 });
}

function card(id: string, rank: Rank): Card {
  return { id, rank, suit: 'spades' };
}

describe('playRound', () => {
  it('deals two cards to every seat and the dealer initially', () => {
    const shoe = newShoe();
    const result = playRound(shoe, 3);
    expect(result.seats).toHaveLength(3);
    for (const seatHands of result.seats) {
      const totalCards = seatHands.reduce((sum, h) => sum + h.cards.length, 0);
      expect(totalCards).toBeGreaterThanOrEqual(2);
    }
    expect(result.dealer.cards.length).toBeGreaterThanOrEqual(2);
  });

  it('produces a valid final status for every hand', () => {
    const shoe = newShoe();
    const result = playRound(shoe, 6);
    const validStatuses = ['stand', 'bust', 'blackjack'];
    for (const seatHands of result.seats) {
      for (const hand of seatHands) {
        expect(validStatuses).toContain(hand.status);
        const ev = evaluateHand(hand.cards);
        if (hand.status === 'bust') expect(ev.busted).toBe(true);
        if (hand.status === 'blackjack') expect(ev.blackjack).toBe(true);
      }
    }
    expect(validStatuses).toContain(result.dealer.status);
  });

  it('never gives a split-aces hand more than two cards', () => {
    // Run several rounds with many seats to increase the chance of ace splits.
    const shoe = newShoe(8);
    for (let i = 0; i < 40; i += 1) {
      const result = playRound(shoe, 6);
      for (const seatHands of result.seats) {
        for (const hand of seatHands) {
          if (hand.isSplitAces) {
            expect(hand.cards.length).toBe(2);
          }
        }
      }
      if (shoe.isPastCutCard()) break;
    }
  });

  it('never produces more than 4 resulting hands for a single seat', () => {
    const shoe = newShoe(8);
    for (let i = 0; i < 40; i += 1) {
      const result = playRound(shoe, 6);
      for (const seatHands of result.seats) {
        expect(seatHands.length).toBeLessThanOrEqual(4);
      }
      if (shoe.isPastCutCard()) break;
    }
  });

  it('emits split events that replace the source hand with its resulting hands', () => {
    const shoe = newShoe();
    const cards = [
      card('player-1', '8'),
      card('dealer-up', '6'),
      card('player-2', '8'),
      card('dealer-hole', '10'),
      card('hand-1-draw', '10'),
      card('hand-2-draw', '9'),
      card('dealer-draw', '10'),
    ];
    vi.spyOn(shoe, 'draw').mockImplementation(() => {
      const next = cards.shift();
      if (!next) throw new Error('Unexpected card draw');
      return next;
    });

    const result = playRound(shoe, 1);
    const split = result.events.find((event) => event.kind === 'split');

    expect(split).toMatchObject({
      target: { type: 'player', seatIndex: 0, handId: 'P1-A' },
      hands: [{ id: 'P1-B' }, { id: 'P1-C' }],
    });
    expect(result.seats[0]).toHaveLength(2);
  });

  it('only marks the dealer hole card visible via a reveal event, never on the initial deal', () => {
    const shoe = newShoe();
    const result = playRound(shoe, 2);
    const cardEvents = result.events.filter((event) => event.kind !== 'split');
    const dealerDeals = cardEvents.filter((event) => event.target.type === 'dealer');
    // Second dealer event (the hole card) must be dealt hidden.
    expect(dealerDeals[1].kind).toBe('deal');
    expect(dealerDeals[1].visible).toBe(false);
    // There must be exactly one reveal event for the hole card.
    const reveals = cardEvents.filter((event) => event.kind === 'reveal');
    expect(reveals).toHaveLength(1);
    expect(reveals[0].card.id).toBe(dealerDeals[1].card.id);
  });

  it('does not draw dealer cards when every player hand has busted', () => {
    const shoe = newShoe();
    const cards = [
      card('p1-1', '10'),
      card('p2-1', '10'),
      card('dealer-up', '2'),
      card('p1-2', '2'),
      card('p2-2', '2'),
      card('dealer-hole', '4'),
      card('p1-hit', 'K'),
      card('p2-hit', 'Q'),
    ];
    const draw = vi.spyOn(shoe, 'draw').mockImplementation(() => {
      const next = cards.shift();
      if (!next) throw new Error('Dealer drew after all player hands busted');
      return next;
    });

    const result = playRound(shoe, 2);

    expect(result.seats.flat().every((hand) => hand.status === 'bust')).toBe(true);
    expect(result.dealer.cards).toHaveLength(2);
    expect(result.events.filter((event) => event.kind === 'reveal')).toHaveLength(1);
    expect(draw).toHaveBeenCalledTimes(8);
  });

  it('running count computed only from visible events matches manual Hi-Lo of all events after full reveal', () => {
    const shoe = newShoe();
    const result = playRound(shoe, 4);
    const cardEvents = result.events.filter((event) => event.kind !== 'split');
    let liveCount = 0;
    for (const event of cardEvents) {
      if (event.kind === 'deal' && !event.visible) continue; // hole card hidden until reveal
      liveCount += hiLoValue(event.card.rank);
    }
    // Compute the "true" full count of every dealt card as a cross-check:
    // by the end of the round all events should have contributed exactly once.
    const dealtCardIds = new Set(cardEvents.map((e) => e.card.id));
    let fullCount = 0;
    for (const id of dealtCardIds) {
      const event = cardEvents.find((e) => e.card.id === id)!;
      fullCount += hiLoValue(event.card.rank);
    }
    expect(liveCount).toBe(fullCount);
  });

  it('reports cutCardCrossed once the shoe has been dealt past its cut card', () => {
    const shoe = new Shoe({ deckCount: 2, rng: () => 0.5, penetration: 0.001 });
    const result = playRound(shoe, 1);
    expect(result.cutCardCrossed).toBe(true);
  });

  it('supports 1 to 6 seats', () => {
    for (const seatCount of [1, 2, 3, 4, 5, 6]) {
      const shoe = newShoe();
      const result = playRound(shoe, seatCount);
      expect(result.seats).toHaveLength(seatCount);
    }
  });
});
