import type { SamplerConfig, VideoSampler, VideoSource, SampleOptions, SceneDetectOptions } from './types';
import { sample } from './sample';
import { getVideoInfo } from './info';

export function createSampler(config?: Partial<SamplerConfig>): VideoSampler {
  return {
    async sample(video: VideoSource, options?: Partial<SampleOptions>) {
      return sample(video, { ...config, ...options });
    },

    async getVideoInfo(video: VideoSource) {
      return getVideoInfo(video);
    },

    async detectScenes(_video: VideoSource, _options?: Partial<SceneDetectOptions>) {
      // Stub: scene detection requires sharp — implement in a later phase
      return [];
    },

    async *sampleStream(video: VideoSource, options?: Partial<SampleOptions>) {
      const result = await sample(video, { ...config, ...options });
      for (const frame of result.frames) {
        yield frame;
      }
    },
  };
}
