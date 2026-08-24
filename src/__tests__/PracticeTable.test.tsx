import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
