import { describe, it, expect } from 'vitest';
import { uniformTimestamps } from '../../strategies/uniform';

describe('uniformTimestamps', () => {
  it('returns evenly spaced frames: duration=60, count=3 → [0, 30, 60]', () => {
    expect(uniformTimestamps(60, 3)).toEqual([0, 30, 60]);
  });

  it('returns [duration/2] when count=1', () => {
    expect(uniformTimestamps(60, 1)).toEqual([30]);
  });

  it('returns [] when count=0', () => {
    expect(uniformTimestamps(60, 0)).toEqual([]);
  });

  it('first timestamp is always 0 for count >= 2', () => {
    expect(uniformTimestamps(120, 5)[0]).toBe(0);
  });

  it('last timestamp equals duration for count >= 2', () => {
    const result = uniformTimestamps(120, 5);
    expect(result[result.length - 1]).toBe(120);
  });

  it('returns count timestamps', () => {
    expect(uniformTimestamps(60, 8)).toHaveLength(8);
  });

  it('timestamps are evenly spaced', () => {
    const result = uniformTimestamps(40, 5);
    // [0, 10, 20, 30, 40]
    expect(result).toEqual([0, 10, 20, 30, 40]);
  });
});
