import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('Count Math flow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('configures a drill, answers across zero, shows working, and continues', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Count Math/i }));
    expect(screen.getByRole('heading', { name: 'Count Math Setup' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '+ to −' }));
    await user.click(screen.getByRole('radio', { name: 'Hi-Lo values' }));
    await user.click(screen.getByRole('checkbox', { name: /Increase from 1 card/i }));
    await user.click(screen.getByRole('button', { name: 'Start Count Math' }));

    expect(screen.getByText('Starting count')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByText('−1')).toHaveLength(3);

    await user.type(screen.getByLabelText('Resulting count'), '-1');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeInTheDocument();
    expect(screen.getByText(/Net change:/)).toHaveTextContent('−2');
    expect(screen.getByText('+ → −: 100%')).toBeInTheDocument();
    expect(screen.getByText('Step by step')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByText(/Question 2/)).toBeInTheDocument();
  });

  it('returns home from setup', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Count Math/i }));
    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByRole('heading', { name: 'Blackjack Count Trainer' })).toBeInTheDocument();
  });
});
