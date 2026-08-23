import { describe, expect, it } from 'vitest';
import { speedToDelayMs } from '../session';

describe('speedToDelayMs', () => {
  it('matches the documented anchor points', () => {
    expect(speedToDelayMs(1)).toBeCloseTo(2000, 5);
    expect(speedToDelayMs(5)).toBeCloseTo(1000, 5);
    expect(speedToDelayMs(10)).toBeCloseTo(250, 5);
  });

  it('interpolates smoothly and monotonically decreases as speed increases', () => {
    let previous = speedToDelayMs(1);
    for (let speed = 2; speed <= 10; speed += 1) {
      const current = speedToDelayMs(speed);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });

  it('clamps out-of-range speed values', () => {
    expect(speedToDelayMs(0)).toBeCloseTo(2000, 5);
    expect(speedToDelayMs(20)).toBeCloseTo(250, 5);
  });
});
