import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CountPrompt } from './CountPrompt';

describe('CountPrompt', () => {
  it('requests a numeric mobile keyboard and exposes a sign toggle', () => {
    render(<CountPrompt visible feedback={null} onSubmit={() => {}} onContinue={() => {}} />);

    const input = screen.getByLabelText('Your answer');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('pattern', '-?[0-9]*');
    expect(screen.getByRole('button', { name: 'Toggle sign' })).toHaveTextContent('+/−');
  });

  it.each([
    { entered: '12', toggleSign: false, expected: 12 },
    { entered: '0', toggleSign: false, expected: 0 },
    { entered: '7', toggleSign: true, expected: -7 },
  ])('submits $expected from the mobile-oriented control', ({ entered, toggleSign, expected }) => {
    const onSubmit = vi.fn();
    render(<CountPrompt visible feedback={null} onSubmit={onSubmit} onContinue={() => {}} />);

    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: entered } });
    if (toggleSign) fireEvent.click(screen.getByRole('button', { name: 'Toggle sign' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(expected);
  });
});
