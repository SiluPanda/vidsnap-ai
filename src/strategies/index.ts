import type { SamplingStrategy, VideoInfo, SampleOptions } from '../types';
import { intervalTimestamps } from './interval';
import { uniformTimestamps } from './uniform';
import { keyframeTimestamps } from './keyframe';
import { customTimestamps } from './custom';

export { intervalTimestamps } from './interval';
export { uniformTimestamps } from './uniform';
export { keyframeTimestamps } from './keyframe';
export { customTimestamps } from './custom';

export async function getTimestamps(
  strategy: SamplingStrategy,
  videoInfo: VideoInfo,
  options: Partial<SampleOptions>,
): Promise<number[]> {
  const { duration, fps } = videoInfo;
  const maxFrames = options.maxFrames;
  const minFrames = options.minFrames ?? 1;

  let timestamps: number[];

  switch (strategy) {
    case 'interval': {
      const intervalSecs = options.intervalSeconds ?? 1.0;
      timestamps = intervalTimestamps(duration, intervalSecs, maxFrames);
      break;
    }
    case 'keyframe': {
      timestamps = keyframeTimestamps(duration, fps, maxFrames);
      break;
    }
    case 'custom': {
      if (!options.selector) {
        // fall back to uniform if no selector
        timestamps = uniformTimestamps(duration, options.count ?? 10);
      } else {
        timestamps = await customTimestamps(duration, options.selector, videoInfo);
      }
      break;
    }
    case 'uniform':
    case 'scene':
    case 'hybrid':
    case 'budget':
    default: {
      const count = options.count ?? 10;
      timestamps = uniformTimestamps(duration, count);
      break;
    }
  }

  // apply maxFrames cap
  if (maxFrames !== undefined && timestamps.length > maxFrames) {
    timestamps = timestamps.slice(0, maxFrames);
  }

  // apply minFrames padding (duplicate last timestamp if needed)
  while (timestamps.length < minFrames) {
    const last = timestamps[timestamps.length - 1] ?? 0;
    timestamps.push(last);
  }

  return timestamps;
}
