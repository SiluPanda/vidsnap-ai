import { describe, it, expect } from 'vitest';
import type {
  VideoSource,
  SamplingStrategy,
  SceneAlgorithm,
  FrameSelector,
  VideoInfo,
  SampledFrame,
  SampleOptions,
  SamplerConfig,
  VideoSampler,
  SampleResult,
  SampleMeta,
  SceneChange,
  SceneDetectOptions,
} from '../types';

// ── SamplingStrategy union ────────────────────────────────────────────────────

describe('SamplingStrategy', () => {
  it('accepts all 7 valid strategy values', () => {
    const strategies: SamplingStrategy[] = [
      'interval',
      'scene',
      'keyframe',
      'hybrid',
      'uniform',
      'budget',
      'custom',
    ];
    expect(strategies).toHaveLength(7);
    strategies.forEach(s => expect(typeof s).toBe('string'));
  });
});

// ── SceneAlgorithm union ──────────────────────────────────────────────────────

describe('SceneAlgorithm', () => {
  it('covers all 4 algorithm values', () => {
    const algorithms: SceneAlgorithm[] = ['histogram', 'pixel', 'phash', 'ssim'];
    expect(algorithms).toHaveLength(4);
    algorithms.forEach(a => expect(typeof a).toBe('string'));
  });
});

// ── VideoInfo required shape ──────────────────────────────────────────────────

describe('VideoInfo', () => {
  it('accepts a fully populated VideoInfo object', () => {
    const info: VideoInfo = {
      path: '/tmp/test.mp4',
      duration: 120.5,
      fps: 29.97,
      width: 1920,
      height: 1080,
      codec: 'h264',
      totalFrames: 3612,
      fileSize: 52428800,
      bitrate: 3500000,
      hasAudio: true,
      format: 'mp4',
    };

    expect(info.path).toBe('/tmp/test.mp4');
    expect(info.duration).toBe(120.5);
    expect(info.fps).toBe(29.97);
    expect(info.width).toBe(1920);
    expect(info.height).toBe(1080);
    expect(info.codec).toBe('h264');
    expect(info.totalFrames).toBe(3612);
    expect(info.fileSize).toBe(52428800);
    expect(info.bitrate).toBe(3500000);
    expect(info.hasAudio).toBe(true);
    expect(info.format).toBe('mp4');
  });
});

// ── SampledFrame shape ────────────────────────────────────────────────────────

describe('SampledFrame', () => {
  it('has required fields: timestamp, index, buffer, mimeType, width, height, byteLength, isSceneChange', () => {
    const frame: SampledFrame = {
      buffer: Buffer.from('fake-image-data'),
      timestamp: 5.0,
      index: 0,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      byteLength: 15,
      isSceneChange: false,
    };

    expect(frame.timestamp).toBe(5.0);
    expect(frame.index).toBe(0);
    expect(Buffer.isBuffer(frame.buffer)).toBe(true);
    expect(frame.mimeType).toBe('image/jpeg');
    expect(frame.width).toBe(1920);
    expect(frame.height).toBe(1080);
    expect(frame.byteLength).toBe(15);
    expect(frame.isSceneChange).toBe(false);
  });

  it('accepts optional fields: base64, sceneChangeScore, similarity, tokens, cost, contentBlock', () => {
    const frame: SampledFrame = {
      buffer: Buffer.alloc(0),
      timestamp: 10.5,
      index: 1,
      mimeType: 'image/png',
      width: 640,
      height: 480,
      byteLength: 0,
      isSceneChange: true,
      base64: 'abc123',
      sceneChangeScore: 0.75,
      similarity: 0.2,
      tokens: 765,
      cost: 0.001913,
      contentBlock: { type: 'image_url' },
    };

    expect(frame.base64).toBe('abc123');
    expect(frame.sceneChangeScore).toBe(0.75);
    expect(frame.similarity).toBe(0.2);
    expect(frame.tokens).toBe(765);
    expect(frame.cost).toBe(0.001913);
    expect(frame.contentBlock).toEqual({ type: 'image_url' });
    expect(frame.isSceneChange).toBe(true);
  });
});

// ── SampleOptions all-optional ────────────────────────────────────────────────

describe('SampleOptions', () => {
  it('can be constructed with no fields (all optional)', () => {
    const opts: SampleOptions = {};
    expect(opts).toBeDefined();
  });

  it('accepts all optional fields', () => {
    const selector: FrameSelector = (info) => [0, info.duration / 2, info.duration - 1];
    const opts: SampleOptions = {
      strategy: 'hybrid',
      maxFrames: 20,
      minFrames: 1,
      intervalSeconds: 2.0,
      threshold: 0.3,
      algorithm: 'histogram',
      algorithms: ['histogram', 'phash'],
      consensus: 2,
      analyzeInterval: 0.25,
      minGap: 0.5,
      count: 10,
      tokenBudget: 5000,
      provider: 'openai',
      detail: 'high',
      selector,
      dedup: true,
      dedupThreshold: 0.9,
      outputFormat: 'jpeg',
      quality: 85,
      outputBase64: false,
      maxWidth: 1920,
      maxHeight: 1080,
      prepareForProvider: 'openai',
      model: 'gpt-4o',
    };
    expect(opts.strategy).toBe('hybrid');
    expect(opts.maxFrames).toBe(20);
    expect(opts.selector).toBe(selector);
  });
});

// ── SamplerConfig all-optional (extends SampleOptions) ───────────────────────

describe('SamplerConfig', () => {
  it('can be constructed with no fields', () => {
    const config: SamplerConfig = {};
    expect(config).toBeDefined();
  });

  it('accepts SampleOptions fields as defaults', () => {
    const config: SamplerConfig = {
      strategy: 'scene',
      maxFrames: 15,
      dedup: true,
      outputBase64: true,
      provider: 'anthropic',
    };
    expect(config.strategy).toBe('scene');
    expect(config.provider).toBe('anthropic');
  });
});

// ── VideoSampler interface mock ───────────────────────────────────────────────

describe('VideoSampler', () => {
  it('can be mock-implemented', async () => {
    const mockVideoInfo: VideoInfo = {
      path: '/tmp/video.mp4',
      duration: 60,
      fps: 30,
      width: 1280,
      height: 720,
      codec: 'h264',
      totalFrames: 1800,
      fileSize: 10485760,
      bitrate: 1400000,
      hasAudio: false,
      format: 'mp4',
    };

    const mockSampleMeta: SampleMeta = {
      strategy: 'uniform',
      candidatesEvaluated: 10,
      framesDeduped: 0,
      sceneChangesDetected: 0,
      processingTimeMs: 150,
    };

    const mockResult: SampleResult = {
      frames: [],
      video: mockVideoInfo,
      meta: mockSampleMeta,
    };

    const mockSceneChange: SceneChange = {
      timestamp: 5.0,
      score: 0.65,
      algorithm: 'histogram',
      frameIndex: 20,
    };

    const sampler: VideoSampler = {
      sample: async (_video, _options) => mockResult,
      sampleStream: (function* () { return; })() as unknown as VideoSampler['sampleStream'],
      detectScenes: async (_video, _options) => [mockSceneChange],
      getVideoInfo: async (_video) => mockVideoInfo,
    };

    const result = await sampler.sample('./test.mp4');
    expect(result.frames).toEqual([]);
    expect(result.video.codec).toBe('h264');
    expect(result.meta.strategy).toBe('uniform');

    const scenes = await sampler.detectScenes('./test.mp4');
    expect(scenes).toHaveLength(1);
    expect(scenes[0].algorithm).toBe('histogram');
    expect(scenes[0].frameIndex).toBe(20);

    const info = await sampler.getVideoInfo('./test.mp4');
    expect(info.duration).toBe(60);
    expect(info.hasAudio).toBe(false);
  });
});

// ── SceneDetectOptions ────────────────────────────────────────────────────────

describe('SceneDetectOptions', () => {
  it('can be constructed with no fields (all optional)', () => {
    const opts: SceneDetectOptions = {};
    expect(opts).toBeDefined();
  });

  it('accepts all optional fields', () => {
    const opts: SceneDetectOptions = {
      algorithm: 'ssim',
      algorithms: ['histogram', 'ssim'],
      consensus: 2,
      threshold: 0.25,
      analyzeInterval: 0.5,
    };
    expect(opts.algorithm).toBe('ssim');
    expect(opts.threshold).toBe(0.25);
  });
});

// ── VideoSource type ──────────────────────────────────────────────────────────

describe('VideoSource', () => {
  it('accepts a string path', () => {
    const src: VideoSource = '/path/to/video.mp4';
    expect(typeof src).toBe('string');
  });

  it('accepts a Buffer', () => {
    const src: VideoSource = Buffer.from([0xff, 0xd8, 0xff]);
    expect(Buffer.isBuffer(src)).toBe(true);
  });
});

// ── FrameSelector type ────────────────────────────────────────────────────────

describe('FrameSelector', () => {
  it('can be a sync function returning number[]', () => {
    const info: VideoInfo = {
      path: '/tmp/video.mp4',
      duration: 30,
      fps: 24,
      width: 1280,
      height: 720,
      codec: 'vp9',
      totalFrames: 720,
      fileSize: 5000000,
      bitrate: 1300000,
      hasAudio: true,
      format: 'webm',
    };
    const selector: FrameSelector = (videoInfo) => [0, videoInfo.duration / 2];
    const result = selector(info);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([0, 15]);
  });

  it('can be an async function returning Promise<number[]>', async () => {
    const info: VideoInfo = {
      path: '/tmp/video.mp4',
      duration: 60,
      fps: 30,
      width: 1920,
      height: 1080,
      codec: 'h264',
      totalFrames: 1800,
      fileSize: 20971520,
      bitrate: 2800000,
      hasAudio: true,
      format: 'mp4',
    };
    const selector: FrameSelector = async (videoInfo) => [0, videoInfo.duration - 1];
    const result = await selector(info);
    expect(result).toEqual([0, 59]);
  });
});
