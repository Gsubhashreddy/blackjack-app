import { useState } from 'react';
import { Home } from './screens/Home';
import { RunningCountSetup } from './screens/RunningCountSetup';
import { PracticeTable } from './screens/PracticeTable';
import { SummaryScreen } from './screens/SummaryScreen';
import type { RunningCountSettings, SessionSummary } from './domain/session';

type Route =
  | { screen: 'home' }
  | { screen: 'setup' }
  | { screen: 'practice'; settings: RunningCountSettings; key: number }
  | { screen: 'summary'; settings: RunningCountSettings; summary: SessionSummary };

function App() {
  const [route, setRoute] = useState<Route>({ screen: 'home' });

  if (route.screen === 'home') {
    return <Home onSelectRunningCount={() => setRoute({ screen: 'setup' })} />;
  }

  if (route.screen === 'setup') {
    return (
      <RunningCountSetup
        onStart={(settings) => setRoute({ screen: 'practice', settings, key: Date.now() })}
        onBack={() => setRoute({ screen: 'home' })}
      />
    );
  }

  if (route.screen === 'practice') {
    return (
      <PracticeTable
        key={route.key}
        settings={route.settings}
        onEnd={(summary) => setRoute({ screen: 'summary', settings: route.settings, summary })}
      />
    );
  }

  return (
    <SummaryScreen
      summary={route.summary}
      onRestartSameSettings={() => setRoute({ screen: 'practice', settings: route.settings, key: Date.now() })}
      onHome={() => setRoute({ screen: 'home' })}
    />
  );
}

export default App;
