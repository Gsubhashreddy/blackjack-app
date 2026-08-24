import { type Card, type Rank, cardValue } from './cards';
import { evaluateHand, isPair } from './hand';

export type Action = 'hit' | 'stand' | 'double' | 'split';

export interface StrategyContext {
  /** The cards currently in the hand being decided. */
  cards: Card[];
  /** Dealer's visible upcard rank. */
  dealerUpcard: Rank;
  /** Doubling is only offered on an initial two-card hand. */
  canDouble: boolean;
  /** Splitting is only offered while below the max resulting hands and rank matches. */
  canSplit: boolean;
  /** True when this hand came from splitting a pair of aces (one card only, no further action). */
  isSplitAces: boolean;
}

/**
 * Maps a dealer upcard to a 0-9 column index representing 2,3,4,5,6,7,8,9,10,A.
 */
function upcardIndex(rank: Rank): number {
  const value = cardValue(rank) === 11 ? 11 : cardValue(rank);
  if (value === 11) return 9; // Ace
  if (value === 10) return 8; // 10, J, Q, K
  return value - 2; // 2..9
}

// The tables below encode a standard multi-deck basic strategy for the
// ruleset used by this app: dealer hits soft 17 (H17), double after split
// allowed (DAS), double on any first two cards, no surrender, split aces
// receive one card each and cannot be resplit. Columns are dealer upcards
// 2,3,4,5,6,7,8,9,10,A. This matches commonly published H17/DAS charts
// (e.g. Wizard of Odds basic strategy engine).

const STAND = 'S';
const HIT = 'H';
const DOUBLE_ELSE_HIT = 'Dh';
const DOUBLE_ELSE_STAND = 'Ds';
const SPLIT = 'P';

// Hard totals 5-17+ (index 0 = total 5) vs dealer upcard column.
const HARD_TOTALS: Record<number, string[]> = {
  5: [HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  6: [HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  7: [HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  8: [HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  9: [HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  10: [
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    HIT,
    HIT,
  ],
  11: [
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
  ],
  12: [HIT, HIT, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  13: [STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  14: [STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  15: [STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  16: [STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  17: [STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
};

// Soft totals (A+2 .. A+9, i.e. soft 13-20) vs dealer upcard column.
const SOFT_TOTALS: Record<number, string[]> = {
  13: [HIT, HIT, HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  14: [HIT, HIT, HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  15: [HIT, HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  16: [HIT, HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  17: [HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, DOUBLE_ELSE_HIT, HIT, HIT, HIT, HIT, HIT],
  18: [
    DOUBLE_ELSE_STAND,
    DOUBLE_ELSE_STAND,
    DOUBLE_ELSE_STAND,
    DOUBLE_ELSE_STAND,
    DOUBLE_ELSE_STAND,
    STAND,
    STAND,
    HIT,
    HIT,
    HIT,
  ],
  19: [STAND, STAND, STAND, STAND, DOUBLE_ELSE_STAND, STAND, STAND, STAND, STAND, STAND],
  20: [STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
};

// Pairs (2,2 .. 10,10 and A,A) vs dealer upcard column. Assumes DAS.
const PAIR_TOTALS: Record<string, string[]> = {
  '2': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT],
  '3': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT],
  '4': [HIT, HIT, HIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT, HIT],
  '5': [
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    DOUBLE_ELSE_HIT,
    HIT,
    HIT,
  ],
  '6': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT],
  '7': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT],
  '8': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT],
  '9': [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, STAND, SPLIT, SPLIT, STAND, STAND],
  '10': [STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  A: [SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT],
};

function resolveCode(code: string, canDouble: boolean, fallbackWhenNoDouble: Action): Action {
  if (code === STAND) return 'stand';
  if (code === HIT) return 'hit';
  if (code === SPLIT) return 'split';
  if (code === DOUBLE_ELSE_HIT) return canDouble ? 'double' : 'hit';
  if (code === DOUBLE_ELSE_STAND) return canDouble ? 'double' : fallbackWhenNoDouble;
  return 'hit';
}

/**
 * Determines the basic-strategy action for a player hand given the dealer's
 * upcard and the current split/double eligibility.
 */
export function getBasicStrategyAction(context: StrategyContext): Action {
  const { cards, dealerUpcard, canDouble, canSplit, isSplitAces } = context;

  // Split aces receive exactly one card and never act again.
  if (isSplitAces) return 'stand';

  const col = upcardIndex(dealerUpcard);
  const { total, soft } = evaluateHand(cards);

  if (canSplit && isPair(cards)) {
    const rank = cards[0].rank === 'A' ? 'A' : String(cardValue(cards[0].rank));
    const row = PAIR_TOTALS[rank];
    if (row) {
      const code = row[col];
      if (code === SPLIT) return 'split';
      // Fall through to hard/soft total logic below when not splitting.
      if (rank !== 'A') {
        return resolveCode(code, canDouble, 'stand');
      }
    }
  }

  if (soft && total <= 20) {
    const row = SOFT_TOTALS[total] ?? SOFT_TOTALS[13];
    return resolveCode(row[col], canDouble, 'stand');
  }

  const clampedTotal = Math.min(Math.max(total, 5), 17);
  const row = HARD_TOTALS[clampedTotal];
  return resolveCode(row[col], canDouble, 'hit');
}
