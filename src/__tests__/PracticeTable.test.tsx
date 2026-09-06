import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/session';
import type { TableHand } from '../domain/practiceController';
import { PlayerSeats, PracticeTable } from '../screens/PracticeTable';

function hand(id: string): TableHand {
  return {
    id,
    cards: [{ card: { id: `${id}-card`, rank: '10', suit: 'spades' }, faceUp: true }],
    status: 'stand',
  };
}

describe('Practice table settings', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows elapsed seconds at the top and freezes the timer while paused', () => {
    vi.useFakeTimers();
    render(<PracticeTable settings={{ ...DEFAULT_SETTINGS, speed: 1 }} onEnd={() => {}} />);
    const timer = screen.getByRole('timer', { name: 'Active session time' });
    expect(timer).toHaveTextContent('Time: 0s');
    expect(timer).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(1000));
    expect(timer).toHaveTextContent('Time: 1s');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(3000));
    expect(timer).toHaveTextContent('Time: 1s');
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Game paused' })).getByRole('button', { name: 'Resume' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(timer).toHaveTextContent('Time: 2s');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset session' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reset' }));
    expect(timer).toHaveTextContent('Time: 0s');
  });

  it('highlights the receiving player and clears the highlight when paused', () => {
    vi.useFakeTimers();
    const { container } = render(
      <PracticeTable settings={{ ...DEFAULT_SETTINGS, speed: 1, showTableWhilePaused: true }} onEnd={() => {}} />,
    );
    expect(screen.queryByText('Dealing')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    const player = screen.getByRole('region', { name: 'Player 1' });
    expect(player).toHaveClass('seat-receiving');
    expect(within(player).getByText('Dealing')).toBeInTheDocument();
    expect(container.querySelectorAll('.hand-receiving')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(container.querySelector('.hand-receiving')).not.toBeInTheDocument();
  });

  it('lets the user show the table while the session is paused', () => {
    render(
      <PracticeTable
        settings={{ ...DEFAULT_SETTINGS, seatCount: 1, showTableWhilePaused: false }}
        onEnd={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Session paused. Table hidden.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Table visibility settings' }));
    const pauseVisibility = screen.getByRole('checkbox', { name: 'Show table while paused' });
    expect(pauseVisibility).not.toBeChecked();
    fireEvent.click(pauseVisibility);

    expect(screen.getByText('Dealer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog', { name: 'Table visibility' })).not.toBeInTheDocument();
  });

  it('keeps secondary actions in the pause menu and supports an on-demand count check', () => {
    render(<PracticeTable settings={{ ...DEFAULT_SETTINGS, seatCount: 1 }} onEnd={() => {}} />);

    expect(screen.queryByRole('button', { name: 'End session' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    const pauseMenu = screen.getByRole('dialog', { name: 'Game paused' });
    expect(pauseMenu).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check running count' }));
    expect(screen.getByRole('dialog', { name: 'What is the running count?' })).toBeInTheDocument();
  });

  it('groups multiple players while making split hands horizontal and sequentially numbered', () => {
    const { container } = render(
      <PlayerSeats
        seats={[
          [hand('P1-A')],
          [hand('P2-B'), hand('P2-C'), hand('P2-D'), hand('P2-E')],
          [hand('P3-A')],
        ]}
      />,
    );

    expect(container.querySelectorAll('.seat')).toHaveLength(3);
    expect(screen.getAllByText('Player 2')).toHaveLength(1);
    expect(screen.getByText('Hand 1')).toBeInTheDocument();
    expect(screen.getByText('Hand 4')).toBeInTheDocument();
    expect(screen.queryByText(/Player 2-/)).not.toBeInTheDocument();
    expect(container.querySelector('.seat-split .seat-hands-scrollable')).toBeInTheDocument();
  });

  it('distinguishes the receiving split hand and keeps all hands in focusable player groups', () => {
    const longHand = hand('P1-A');
    longHand.cards = Array.from({ length: 10 }, (_, index) => ({
      card: { id: `long-${index}`, rank: '2', suit: 'clubs' },
      faceUp: true,
    }));
    const seats = [[longHand], [hand('P2-B'), hand('P2-C'), hand('P2-D'), hand('P2-E')]];
    const { container, rerender } = render(<PlayerSeats seats={seats} activeHandId="P2-E" />);
    const player = screen.getByRole('region', { name: 'Player 2' });
    expect(player).toHaveClass('seat-receiving');
    expect(within(player).getByText('Hand 4').closest('.hand')).toHaveClass('hand-receiving');
    expect(container.querySelectorAll('.hand-receiving')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Player 1 hands' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('group', { name: 'Player 2 hands' })).toHaveClass('seat-hands-scrollable');
    expect(within(screen.getByRole('group', { name: 'Player 1 hands' })).getAllByText('2')).toHaveLength(10);
    rerender(<PlayerSeats seats={seats} activeHandId="P1-A" />);
    expect(player).not.toHaveClass('seat-receiving');
    expect(screen.getByRole('region', { name: 'Player 1' })).toHaveClass('seat-receiving');
  });

  it('scrolls the receiving split hand into its own player group', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('seat-hands')) {
        return { left: 0, right: 100 } as DOMRect;
      }
      return { left: 120, right: 210 } as DOMRect;
    });
    render(<PlayerSeats seats={[[hand('P1-B'), hand('P1-C')]]} activeHandId="P1-C" />);
    expect(screen.getByRole('group', { name: 'Player 1 hands' }).scrollLeft).toBe(110);
  });
});
