import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('End-to-end practice flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets a user configure, run, answer, and finish a running count session down to the summary', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
    render(<App />);

    // Home -> Setup
    await user.click(screen.getByRole('button', { name: /Running Count/i }));
    expect(screen.getByRole('heading', { name: /Running Count Setup/i })).toBeInTheDocument();

    // Configure for a fast, small, deterministic-ish session: 1 seat, 2 decks, top speed, ask every round.
    const seatSlider = screen.getByLabelText(/Number of simulated seats/i);
    await act(async () => {
      fireEvent.change(seatSlider, { target: { value: '1' } });
    });

    await user.click(screen.getByRole('radio', { name: '2' }));

    const speedSlider = screen.getByLabelText(/Card speed/i);
    await act(async () => {
      fireEvent.change(speedSlider, { target: { value: '10' } });
    });

    // askEveryRounds defaults to 3; lower it to 1 via the stepper.
    await user.click(screen.getByRole('button', { name: /Decrease rounds/i }));
    await user.click(screen.getByRole('button', { name: /Decrease rounds/i }));

    await user.click(screen.getByRole('button', { name: /Start Practice/i }));

    // Practice table should appear.
    expect(await screen.findByText(/Round/i)).toBeInTheDocument();

    // Advance fake timers enough for a full round of dealing to complete and
    // the count prompt to appear.
    let promptShown = false;
    for (let i = 0; i < 200 && !promptShown; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      promptShown = screen.queryByRole('dialog') !== null;
    }
    expect(promptShown).toBe(true);

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/Your answer/i);
    await user.type(input, '0');
    await user.click(within(dialog).getByRole('button', { name: /Submit/i }));

    // Feedback (Correct or Incorrect) must show immediately.
    expect(within(dialog).getByText(/^(Correct!|Incorrect)$/)).toBeInTheDocument();

    // End the session manually to reach the summary quickly.
    await user.click(within(dialog).getByRole('button', { name: /Continue/i }));

    // Give the next round a brief moment to start, then end the session.
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await user.click(screen.getByRole('button', { name: /End Session/i }));

    expect(await screen.findByRole('heading', { name: /Session Summary/i })).toBeInTheDocument();
    expect(screen.getByText(/Ended by user/i)).toBeInTheDocument();
    expect(screen.getByText(/Questions answered/i)).toBeInTheDocument();
  }, 20000);
});
