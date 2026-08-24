import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/session';
import { PracticeTable } from '../screens/PracticeTable';

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
});
