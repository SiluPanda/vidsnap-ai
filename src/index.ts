export type {
  VideoSource,
  SamplingStrategy,
  SceneAlgorithm,
  FrameSelector,
  VideoInfo,
  SampledFrame,
  SceneChange,
  SampleMeta,
  SampleResult,
  SampleOptions,
  SceneDetectOptions,
  SamplerConfig,
  VideoSampler,
} from './types';
export { VideoNotFoundError, InvalidVideoError, FfmpegNotFoundError } from './errors';
// createSampler — to be implemented in Phase 2
