import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('Missing Card flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('configures, pauses, completes, guesses, replays, and exits the drill', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Missing Card/i }));
    expect(screen.getByRole('heading', { name: 'Missing Card Setup' })).toBeInTheDocument();

    expect(screen.getAllByRole('radio')).toHaveLength(5);
    await user.click(screen.getByRole('radio', { name: '1' }));
    fireEvent.change(screen.getByLabelText(/Card speed/i), { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Start Missing Card' }));

    expect(screen.getByText('Cards dealt: 1 / 51')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('status')).toHaveTextContent('Session paused');
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Cards dealt: 1 / 51')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    await act(async () => {
      vi.runAllTimers();
    });

    expect(
      screen.getByRole('heading', { name: "What is the hidden card's Hi-Lo value?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /High card/ }));

    expect(screen.getByRole('heading', { name: 'Missing Card Result' })).toBeInTheDocument();
    expect(screen.getByText(/^(Correct!|Incorrect)$/)).toBeInTheDocument();
    expect(screen.getByText('Correct Hi-Lo value')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Replay with same settings' }));
    expect(screen.getByRole('heading', { name: 'Missing Card' })).toBeInTheDocument();
    expect(screen.getByText('Cards dealt: 1 / 51')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'End Session' }));
    expect(screen.getByText('Session ended early.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Return home' }));
    expect(screen.getByRole('heading', { name: 'Blackjack Count Trainer' })).toBeInTheDocument();
  });
});
