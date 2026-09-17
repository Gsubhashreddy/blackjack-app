import { useState } from 'react';
import { Home } from './screens/Home';
import { RunningCountSetup } from './screens/RunningCountSetup';
import { PracticeTable } from './screens/PracticeTable';
import { SummaryScreen } from './screens/SummaryScreen';
import type { RunningCountSettings, SessionSummary } from './domain/session';
import { MissingCardSetup } from './screens/MissingCardSetup';
import { MissingCardPractice } from './screens/MissingCardPractice';
import { MissingCardResultScreen } from './screens/MissingCardResultScreen';
import type { MissingCardResult, MissingCardSettings } from './domain/missingCardController';
import { CountMathSetup } from './screens/CountMathSetup';
import { CountMathPractice } from './screens/CountMathPractice';
import type { CountMathSettings } from './domain/countMath';

type Route =
  | { screen: 'home' }
  | { screen: 'running-setup' }
  | { screen: 'running-practice'; settings: RunningCountSettings; key: number }
  | { screen: 'running-summary'; settings: RunningCountSettings; summary: SessionSummary }
  | { screen: 'missing-setup' }
  | { screen: 'missing-practice'; settings: MissingCardSettings; key: number }
  | { screen: 'missing-result'; settings: MissingCardSettings; result: MissingCardResult }
  | { screen: 'count-math-setup' }
  | { screen: 'count-math-practice'; settings: CountMathSettings; key: number };

function App() {
  const [route, setRoute] = useState<Route>({ screen: 'home' });

  if (route.screen === 'home') {
    return (
      <Home
        onSelectRunningCount={() => setRoute({ screen: 'running-setup' })}
        onSelectMissingCard={() => setRoute({ screen: 'missing-setup' })}
        onSelectCountMath={() => setRoute({ screen: 'count-math-setup' })}
      />
    );
  }

  if (route.screen === 'running-setup') {
    return (
      <RunningCountSetup
        onStart={(settings) => setRoute({ screen: 'running-practice', settings, key: Date.now() })}
        onBack={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'running-practice') {
    return (
      <PracticeTable
        key={route.key}
        settings={route.settings}
        onEnd={(summary) => setRoute({ screen: 'running-summary', settings: route.settings, summary })}
      />
    );
  }

  if (route.screen === 'running-summary') {
    return (
      <SummaryScreen
        summary={route.summary}
        onRestartSameSettings={() =>
          setRoute({ screen: 'running-practice', settings: route.settings, key: Date.now() })
        }
        onHome={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'missing-setup') {
    return (
      <MissingCardSetup
        onStart={(settings) => setRoute({ screen: 'missing-practice', settings, key: Date.now() })}
        onBack={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'missing-practice') {
    return (
      <MissingCardPractice
        key={route.key}
        settings={route.settings}
        onEnd={(result) => setRoute({ screen: 'missing-result', settings: route.settings, result })}
      />
    );
  }

  if (route.screen === 'missing-result') {
    return (
      <MissingCardResultScreen
        result={route.result}
        onReplay={() => setRoute({ screen: 'missing-practice', settings: route.settings, key: Date.now() })}
        onHome={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'count-math-setup') {
    return (
      <CountMathSetup
        onStart={(settings) => setRoute({ screen: 'count-math-practice', settings, key: Date.now() })}
        onBack={() => setRoute({ screen: 'home' })}
      />
    );
  }

  return <CountMathPractice key={route.key} settings={route.settings} onHome={() => setRoute({ screen: 'home' })} />;
}

export default App;
