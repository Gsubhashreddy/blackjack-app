import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from '../screens/Home';

describe('Home screen', () => {
  it('renders Running Count, Missing Card, Count Math, and Deck Estimation as enabled modes', () => {
    render(
      <Home
        onSelectRunningCount={() => {}}
        onSelectMissingCard={() => {}}
        onSelectCountMath={() => {}}
        onSelectDeckEstimation={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Running Count/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Missing Card/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Count Math/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deck Estimation/i })).toBeInTheDocument();
    expect(screen.getByText('True Count')).toBeInTheDocument();
    expect(screen.getByText('Basic Strategy')).toBeInTheDocument();
    const comingSoon = screen.getAllByText('Coming soon');
    expect(comingSoon).toHaveLength(2);
  });

  it('invokes onSelectRunningCount when the Running Count card is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Home
        onSelectRunningCount={() => (clicked = true)}
        onSelectMissingCard={() => {}}
        onSelectCountMath={() => {}}
        onSelectDeckEstimation={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Running Count/i }));
    expect(clicked).toBe(true);
  });

  it('invokes onSelectMissingCard when the Missing Card mode is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Home
        onSelectRunningCount={() => {}}
        onSelectMissingCard={() => (clicked = true)}
        onSelectCountMath={() => {}}
        onSelectDeckEstimation={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Missing Card/i }));
    expect(clicked).toBe(true);
  });

  it('invokes onSelectCountMath when the Count Math card is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Home
        onSelectRunningCount={() => {}}
        onSelectMissingCard={() => {}}
        onSelectCountMath={() => (clicked = true)}
        onSelectDeckEstimation={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Count Math/i }));
    expect(clicked).toBe(true);
  });

  it('invokes onSelectDeckEstimation when the Deck Estimation card is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(
      <Home
        onSelectRunningCount={() => {}}
        onSelectMissingCard={() => {}}
        onSelectCountMath={() => {}}
        onSelectDeckEstimation={() => (clicked = true)}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Deck Estimation/i }));
    expect(clicked).toBe(true);
  });
});
