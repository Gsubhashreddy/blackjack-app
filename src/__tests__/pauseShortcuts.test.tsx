import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/session';
import { MissingCardPractice } from '../screens/MissingCardPractice';
import { PracticeTable } from '../screens/PracticeTable';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe.each(['running count', 'missing card'] as const)('%s pause shortcuts', (mode) => {
  function start() {
    vi.useFakeTimers();
    return render(mode === 'running count' ? (
      <PracticeTable settings={{ ...DEFAULT_SETTINGS, speed: 1 }} onEnd={() => {}} />
    ) : (
      <MissingCardPractice settings={{ deckCount: 1, speed: 1 }} onEnd={() => {}} />
    ));
  }

  function expectPaused() {
    if (mode === 'running count') {
      expect(screen.getByRole('dialog', { name: 'Game paused' })).toBeInTheDocument();
      expect(screen.getByText('Session paused. Table hidden.')).toBeInTheDocument();
    } else {
      expect(screen.getByRole('status')).toHaveTextContent('Session paused');
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    }
  }

  it.each(['click', 'Space'] as const)('pauses immediately on %s and freezes dealing until Resume', (input) => {
    start();
    act(() => vi.advanceTimersByTime(2000));
    const dealt = screen.getByText(/Cards dealt:/).textContent;
    const elapsed = screen.queryByRole('timer')?.textContent;

    if (input === 'click') {
      fireEvent.click(screen.getByText(mode === 'running count' ? 'Dealer' : 'Current card'));
    } else {
      expect(fireEvent.keyDown(document.body, { key: ' ', code: 'Space' })).toBe(false);
    }
    expectPaused();
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText(/Cards dealt:/)).toHaveTextContent(dealt!);
    expect(screen.queryByRole('timer')?.textContent).toBe(elapsed);

    fireEvent.click(document.body);
    fireEvent.keyDown(document.body, { key: ' ', code: 'Space', repeat: true });
    expectPaused();
    const resume = mode === 'running count'
      ? within(screen.getByRole('dialog', { name: 'Game paused' })).getByRole('button', { name: 'Resume' })
      : screen.getByRole('button', { name: 'Resume' });
    fireEvent.click(resume);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/Cards dealt:/).textContent).not.toBe(dealt);
  });

  it('preserves Pause, count entry, and Continue controls', () => {
    start();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expectPaused();
    fireEvent.click(screen.getByRole('button', { name: 'Check running count' }));
    const answer = screen.getByLabelText('Your answer');
    fireEvent.click(answer);
    expect(fireEvent.keyDown(answer, { key: ' ', code: 'Space' })).toBe(true);
    fireEvent.change(answer, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText(/^(Correct!|Incorrect)$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expectPaused();
  });

  it('ignores other keys, modified Space, and repeats while dealing', () => {
    start();
    fireEvent.keyDown(document.body, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(document.body, { key: ' ', code: 'Space', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: ' ', code: 'Space', repeat: true });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('removes document shortcuts when the practice screen unmounts', () => {
    const { unmount } = start();
    unmount();
    expect(fireEvent.keyDown(document.body, { key: ' ', code: 'Space' })).toBe(true);
  });
});

it('keeps table visibility controls usable while dealing', () => {
  vi.useFakeTimers();
  render(<PracticeTable settings={{ ...DEFAULT_SETTINGS, speed: 1 }} onEnd={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Table visibility settings' }));
  fireEvent.click(screen.getByText('Show table while paused'));
  fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Show table during count prompt' }), {
    key: ' ', code: 'Space',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
});

it('shows the same pause menu without hiding the table when pause visibility is enabled', () => {
  vi.useFakeTimers();
  render(
    <PracticeTable settings={{ ...DEFAULT_SETTINGS, speed: 1, showTableWhilePaused: true }} onEnd={() => {}} />,
  );
  fireEvent.click(screen.getByRole('main'));
  expect(screen.getByRole('dialog', { name: 'Game paused' })).toBeInTheDocument();
  expect(screen.getByText('Dealer')).toBeInTheDocument();
  expect(screen.queryByText('Session paused. Table hidden.')).not.toBeInTheDocument();
});
