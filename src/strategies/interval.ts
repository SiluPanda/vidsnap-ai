export function intervalTimestamps(
  duration: number,
  intervalSecs: number,
  maxFrames?: number,
): number[] {
  if (duration <= 0 || intervalSecs <= 0) return [0];

  const timestamps: number[] = [];
  let t = 0;
  while (t <= duration) {
    timestamps.push(Math.min(t, duration));
    t += intervalSecs;
  }

  // ensure final frame is included
  const last = timestamps[timestamps.length - 1];
  if (last < duration) {
    timestamps.push(duration);
  }

  // deduplicate
  const unique = [...new Set(timestamps)];

  if (maxFrames !== undefined && unique.length > maxFrames) {
    return unique.slice(0, maxFrames);
  }

  return unique;
}
