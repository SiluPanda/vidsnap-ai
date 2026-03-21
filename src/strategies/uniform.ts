export function uniformTimestamps(duration: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [duration / 2];

  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    timestamps.push((i / (count - 1)) * duration);
  }
  return timestamps;
}
