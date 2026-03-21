import { describe, it, expect } from 'vitest';
import { intervalTimestamps } from '../../strategies/interval';

describe('intervalTimestamps', () => {
  it('generates correct timestamps for 60s at 10s interval', () => {
    const result = intervalTimestamps(60, 10);
    expect(result).toEqual([0, 10, 20, 30, 40, 50, 60]);
  });

  it('always includes 0 as first timestamp', () => {
    const result = intervalTimestamps(30, 5);
    expect(result[0]).toBe(0);
  });

  it('always includes the final frame (duration) as last timestamp', () => {
    const result = intervalTimestamps(60, 10);
    expect(result[result.length - 1]).toBe(60);
  });

  it('caps output at maxFrames', () => {
    const result = intervalTimestamps(60, 10, 4);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('handles duration not evenly divisible by interval', () => {
    const result = intervalTimestamps(65, 10);
    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(65);
    expect(result).toContain(60);
    expect(result).toContain(65);
  });

  it('returns [0] for zero/negative duration', () => {
    expect(intervalTimestamps(0, 10)).toEqual([0]);
    expect(intervalTimestamps(-5, 10)).toEqual([0]);
  });

  it('handles single-frame case (intervalSecs >= duration)', () => {
    const result = intervalTimestamps(5, 10);
    expect(result).toContain(0);
    expect(result).toContain(5);
  });
});
