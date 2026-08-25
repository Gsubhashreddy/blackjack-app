# Blackjack Count Trainer

A mobile-first Progressive Web App (PWA) for practicing Blackjack card
counting with the standard Hi-Lo system. It includes **Running Count
Practice** and a **Missing Card** drill. **True Count** and **Basic Strategy
Drills** are shown on the home screen as "Coming soon" and are not yet
implemented.

## Features

- Configure the number of simulated seats (1–6), deck count (2, 4, 6, or 8),
  card dealing speed, and how often you're asked for the running count.
- Watch a real, rule-correct Blackjack game unfold: simulated players follow
  basic strategy, the dealer hits soft 17 (H17) and peeks for blackjack on an
  Ace/10 upcard, splits/doubles/naturals are handled correctly (including
  double-after-split, up to 4 resulting hands, and one-card split aces).
  - Cards are dealt one at a time at your chosen speed.
  - The internal Hi-Lo running count only updates as cards actually become
    visible to you (the dealer's hole card doesn't count until revealed).
- Answer running-count prompts on a schedule you control, with immediate
  correct/incorrect feedback and a full answer history in the session
  summary.
- Pause, reset (with confirmation), or end the session at any time. Sessions
  end automatically once the shoe's randomized cut card is reached.
- Practice the Missing Card drill with 1, 2, 4, 6, or 8 decks: one card is
  hidden, all remaining cards appear one at a time, and you identify the
  hidden card's Hi-Lo value. The drill supports adjustable speed,
  pause/resume, early exit, and replay.
- Installable as a PWA on mobile home screens, with responsive, accessible,
  mobile-first styling.

## Tech stack

- [Vite](https://vite.dev/) + React + TypeScript
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the web app
  manifest and service worker
- [Vitest](https://vitest.dev/) + [React Testing
  Library](https://testing-library.com/react) for unit and integration tests
- [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting

## Project structure

```
src/
  domain/            # Game/domain logic, framework-agnostic and unit-tested
    cards.ts         # Card primitives, deck construction, Hi-Lo card values
    shoe.ts           # Multi-deck shoe: shuffling and randomized cut card
    hand.ts           # Blackjack hand evaluation (totals, soft/bust/blackjack)
    count.ts          # Hi-Lo running count tracker
    basicStrategy.ts  # Documented basic-strategy decision tables
    gameEngine.ts      # Plays one complete dealer round (deal/peek/act/dealer play)
    practiceController.ts # Session state machine: dealing animation, prompts,
                           # pause/reset/end, cut-card handling (no React)
    session.ts        # Shared types + speed-to-delay mapping
  hooks/
    usePracticeController.ts # Thin React wrapper around PracticeController
  components/         # Presentational React components (cards, hands, dialogs)
  screens/            # Screen-level React components (Home, Setup, Table, Summary)
  App.tsx             # Top-level screen routing (no external router needed)
```

Domain/game logic is intentionally kept independent of React so it can be
unit-tested directly (see `src/domain/__tests__`) and reused if the UI layer
changes later.

## Getting started

### Prerequisites

- Node.js 20+ and npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`) in your
browser. For a true mobile preview, open the printed "Network" URL on a phone
on the same network, or use your browser's device toolbar/responsive mode.

### Run tests

```bash
npm run test        # runs the full suite once
npm run test:watch  # watch mode
```

Tests cover card/shoe construction, Hi-Lo counting, hand evaluation, basic
strategy decisions, the full round engine (deals, splits, doubles, dealer
play, cut-card detection), the practice session state machine (pause/resume/
reset/end/prompt timing), and a UI integration test that drives a full
session from setup through the summary screen.

### Lint

```bash
npm run lint
```

### Build for production

```bash
npm run build
```

This runs a TypeScript project build followed by `vite build`, producing an
optimized, installable PWA bundle in `dist/` (including the web manifest and
service worker).

## Deploy on GitHub Pages

This repository includes a GitHub Actions workflow that deploys the app to
GitHub Pages on every push to `main`.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually).
4. Open the published URL shown in the workflow run (or in Pages settings).

For this repository, the expected production URL is:

- `https://gsubhashreddy.github.io/blackjack-app/`

Once published, open that URL on your phone and use the browser's install/Add
to Home Screen action.

### Preview the production build

```bash
npm run preview
```

## Installing as a PWA (mobile)

1. Build and serve the production bundle (`npm run build && npm run preview`,
   or deploy `dist/` to any static host over HTTPS — PWA installability
   requires either `localhost` or HTTPS).
2. Open the site in a mobile browser (Chrome/Edge on Android, Safari on iOS).
3. Use the browser's "Add to Home Screen" / install prompt to install the app.
   Once installed, it launches full-screen without browser chrome.

## Game rules implemented

- **Counting:** Standard Hi-Lo (2–6 = +1, 7–9 = 0, 10/J/Q/K/A = −1). Every new
  shoe starts at running count 0. A card only affects the count once it is
  visible to the learner.
- **Shoe & cut card:** Shuffled shoe for 2/4/6/8 decks, with a randomized cut
  card placed at 65%–85% penetration. If the cut card is crossed during a
  round, that round is finished and the session ends (no auto-reshuffle).
- **Table rules:** Dealer hits soft 17 (H17); dealer peeks for blackjack on
  an Ace or ten-value upcard; blackjack pays 3:2; no surrender; double on any
  first two cards; double after split allowed; up to 4 resulting hands from
  splits; split aces receive exactly one card each and cannot be resplit.
- **Simulated players:** All player seats follow a documented basic-strategy
  table (see `src/domain/basicStrategy.ts`) consistent with the above rules.

## Notes on this milestone

- Session state does not persist across a page refresh; correctness and a
  usable single-session flow were prioritized over persistence.
- No login or backend is required.
