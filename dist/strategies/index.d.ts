import type { SamplingStrategy, VideoInfo, SampleOptions } from '../types';
export { intervalTimestamps } from './interval';
export { uniformTimestamps } from './uniform';
export { keyframeTimestamps } from './keyframe';
export { customTimestamps } from './custom';
export declare function getTimestamps(strategy: SamplingStrategy, videoInfo: VideoInfo, options: Partial<SampleOptions>): Promise<number[]>;
//# sourceMappingURL=index.d.ts.map