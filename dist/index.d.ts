export type { VideoSource, SamplingStrategy, SceneAlgorithm, FrameSelector, VideoInfo, SampledFrame, SceneChange, SampleMeta, SampleResult, SampleOptions, SceneDetectOptions, SamplerConfig, VideoSampler, } from './types';
export { VideoNotFoundError, InvalidVideoError, FfmpegNotFoundError } from './errors';
export { createSampler } from './create-sampler';
export { sample } from './sample';
export { getVideoInfo } from './info';
export { intervalTimestamps, uniformTimestamps, keyframeTimestamps, customTimestamps, } from './strategies';
//# sourceMappingURL=index.d.ts.map