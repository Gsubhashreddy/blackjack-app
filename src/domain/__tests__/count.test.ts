import { describe, expect, it } from 'vitest';
import type { Card } from '../cards';
import { RunningCount } from '../count';

function card(rank: Card['rank']): Card {
  return { id: rank, rank, suit: 'hearts' };
}

describe('RunningCount', () => {
  it('starts at zero', () => {
    expect(new RunningCount().value()).toBe(0);
  });

  it('accumulates Hi-Lo values as cards are added', () => {
    const rc = new RunningCount();
    rc.addCard(card('5')); // +1
    rc.addCard(card('K')); // -1
    rc.addCard(card('2')); // +1
    expect(rc.value()).toBe(1);
  });

  it('addCards applies every card in order', () => {
    const rc = new RunningCount();
    rc.addCards([card('2'), card('3'), card('4'), card('A')]);
    expect(rc.value()).toBe(2);
  });

  it('reset returns the count to zero', () => {
    const rc = new RunningCount();
    rc.addCards([card('2'), card('3')]);
    rc.reset();
    expect(rc.value()).toBe(0);
  });

  it('never counts a card until addCard/addCards is explicitly called (hole-card safety)', () => {
    const rc = new RunningCount();
    // Simulate a hidden hole card: caller simply does not call addCard yet.
    expect(rc.value()).toBe(0);
    rc.addCard(card('K')); // now revealed
    expect(rc.value()).toBe(-1);
  });
});
