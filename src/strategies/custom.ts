import type { FrameSelector, VideoInfo } from '../types';

export async function customTimestamps(
  duration: number,
  selector: FrameSelector,
  videoInfo: VideoInfo,
): Promise<number[]> {
  void duration; // available to selector via videoInfo.duration
  const result = selector(videoInfo);
  return Promise.resolve(result);
}
