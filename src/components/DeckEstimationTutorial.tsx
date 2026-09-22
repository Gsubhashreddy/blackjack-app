import { CardTray } from './CardTray';
import { decksToCards, formatDecks } from '../domain/deckEstimation';

const REFERENCE_DECKS = [0.5, 1, 2, 4, 6, 8];

/** Beginner walkthrough explaining how thick each deck amount looks in a tray. */
export function DeckEstimationTutorial() {
  return (
    <section className="deck-tutorial" aria-labelledby="deck-tutorial-title">
      <h2 id="deck-tutorial-title">How to estimate decks</h2>
      <ol className="deck-tutorial-steps">
        <li>
          One deck is 52 cards. In a discard tray that is roughly a thumb&apos;s width of
          stacked card edges — memorise that block first.
        </li>
        <li>
          Compare, don&apos;t count. Ask yourself &quot;is this one, two, or three of those
          blocks?&quot; then refine to the nearest half deck.
        </li>
        <li>
          Use the tray itself as a ruler: a full 8-deck shoe fills it, so half full is about 4
          decks and a quarter is about 2.
        </li>
        <li>
          Round to the nearest half deck. Being within half a deck is good enough for true
          count conversions.
        </li>
      </ol>
      <div className="deck-tutorial-gallery">
        {REFERENCE_DECKS.map((decks) => (
          <CardTray
            key={decks}
            cardCount={decksToCards(decks)}
            caption={formatDecks(decks)}
            label={`Reference tray holding ${formatDecks(decks)}`}
            size="small"
          />
        ))}
      </div>
    </section>
  );
}
