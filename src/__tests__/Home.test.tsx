import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from '../screens/Home';

describe('Home screen', () => {
  it('renders Running Count and Missing Card as enabled modes', () => {
    render(<Home onSelectRunningCount={() => {}} onSelectMissingCard={() => {}} />);
    expect(screen.getByRole('button', { name: /Running Count/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Missing Card/i })).toBeInTheDocument();
    expect(screen.getByText('True Count')).toBeInTheDocument();
    expect(screen.getByText('Basic Strategy')).toBeInTheDocument();
    const comingSoon = screen.getAllByText('Coming soon');
    expect(comingSoon).toHaveLength(2);
  });

  it('invokes onSelectRunningCount when the Running Count card is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Home onSelectRunningCount={() => (clicked = true)} onSelectMissingCard={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Running Count/i }));
    expect(clicked).toBe(true);
  });

  it('invokes onSelectMissingCard when the Missing Card mode is activated', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Home onSelectRunningCount={() => {}} onSelectMissingCard={() => (clicked = true)} />);
    await user.click(screen.getByRole('button', { name: /Missing Card/i }));
    expect(clicked).toBe(true);
  });
});
