export interface HomeProps {
  onSelectRunningCount: () => void;
  onSelectMissingCard: () => void;
  onSelectCountMath: () => void;
}

export function Home({ onSelectRunningCount, onSelectMissingCard, onSelectCountMath }: HomeProps) {
  return (
    <main className="screen home-screen">
      <h1>Blackjack Count Trainer</h1>
      <p className="subtitle">Practice card counting with a realistic simulated table.</p>
      <div className="mode-cards" role="list">
        <button type="button" className="mode-card mode-card-enabled" onClick={onSelectRunningCount}>
          <h2>Running Count</h2>
          <p>Track the Hi-Lo running count as simulated hands play out.</p>
        </button>
        <button type="button" className="mode-card mode-card-enabled" onClick={onSelectMissingCard}>
          <h2>Missing Card</h2>
          <p>Count through a shoe and identify one hidden card&apos;s Hi-Lo value.</p>
        </button>
        <button type="button" className="mode-card mode-card-enabled" onClick={onSelectCountMath}>
          <h2>Count Math</h2>
          <p>Practice fast count changes across zero with cards or Hi-Lo values.</p>
        </button>
        <div className="mode-card mode-card-disabled" role="listitem" aria-disabled="true">
          <h2>True Count</h2>
          <p>Coming soon</p>
        </div>
        <div className="mode-card mode-card-disabled" role="listitem" aria-disabled="true">
          <h2>Basic Strategy</h2>
          <p>Coming soon</p>
        </div>
      </div>
    </main>
  );
}
