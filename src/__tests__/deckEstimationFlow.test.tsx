import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('Deck Estimation flow', () => {
  it('configures the drill, estimates a tray, and reveals the answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Deck Estimation/i }));
    expect(screen.getByRole('heading', { name: 'Deck Estimation Setup' })).toBeInTheDocument();
    expect(screen.getByText('New to this? Open the tutorial')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Whole decks' }));
    await user.click(screen.getByRole('button', { name: 'Start Deck Estimation' }));

    expect(screen.getByRole('img', { name: 'Tray of cards to estimate' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Reference tray holding 1 deck' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Increase estimate by half a deck' }));
    expect(screen.getByText('Your estimate: 1.5 decks')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Your estimate/), { target: { value: '4' } });
    expect(screen.getByText('Your estimate: 4 decks')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Check estimate' }));
    expect(screen.getByText(/Actual:/)).toBeInTheDocument();
    expect(screen.getByText(/cards in the tray/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show tutorial' }));
    expect(screen.getByRole('heading', { name: 'How to estimate decks' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tray' }));
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Your estimate: 1 deck')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'End' }));
    expect(screen.getByRole('heading', { name: 'Blackjack Count Trainer' })).toBeInTheDocument();
  });
});
