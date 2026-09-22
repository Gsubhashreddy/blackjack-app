import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardTray, ROTATION_STEP_DEG } from './CardTray';

function stackOf(container: HTMLElement): HTMLElement {
  return container.querySelector('.card-tray-stack') as HTMLElement;
}

describe('CardTray', () => {
  it('grows the stack height with the number of cards', () => {
    const { container: oneDeck } = render(<CardTray cardCount={52} />);
    const { container: twoDecks } = render(<CardTray cardCount={104} />);

    const single = Number.parseFloat(stackOf(oneDeck).style.getPropertyValue('--stack-height'));
    const double = Number.parseFloat(stackOf(twoDecks).style.getPropertyValue('--stack-height'));

    expect(single).toBeGreaterThan(0);
    expect(double).toBeCloseTo(single * 2, 5);
  });

  it('rotates the tray in both directions from the arrow buttons', () => {
    const { container } = render(<CardTray cardCount={52} rotatable />);
    const box = container.querySelector('.card-tray-box') as HTMLElement;
    const initial = Number.parseFloat(box.style.transform.match(/rotateY\((-?[\d.]+)deg\)/)![1]);

    fireEvent.click(screen.getByRole('button', { name: 'Rotate tray right' }));
    expect(box.style.transform).toContain(`rotateY(${initial + ROTATION_STEP_DEG}deg)`);

    fireEvent.click(screen.getByRole('button', { name: 'Rotate tray left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate tray left' }));
    expect(box.style.transform).toContain(`rotateY(${initial - ROTATION_STEP_DEG}deg)`);
  });

  it('hides the rotation controls unless the tray is rotatable', () => {
    render(<CardTray cardCount={52} label="Reference tray" />);

    expect(screen.queryByRole('button', { name: 'Rotate tray left' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Reference tray' })).toBeInTheDocument();
  });
});
