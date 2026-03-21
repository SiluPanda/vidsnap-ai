import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../video/ffprobe', () => ({
  probeVideo: vi.fn().mockResolvedValue({
    path: '/test.mp4',
    width: 1920,
    height: 1080,
    duration: 60,
    fps: 30,
    codec: 'h264',
    bitrate: 5000000,
    fileSize: 100000000,
    format: 'mp4',
    hasAudio: true,
    totalFrames: 1800,
  }),
}));

vi.mock('../video/frame-extractor', () => ({
  extractFrames: vi.fn().mockResolvedValue([
    { timestamp: 0, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 8.571428571428571, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 17.142857142857142, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 25.714285714285715, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 34.285714285714285, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 42.857142857142854, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 51.42857142857143, data: Buffer.from('fake'), width: 1920, height: 1080 },
    { timestamp: 60, data: Buffer.from('fake'), width: 1920, height: 1080 },
  ]),
}));

import { sample } from '../sample';

describe('sample()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a SampleResult with frames, video, meta', async () => {
    const result = await sample('/test.mp4');

    expect(result).toHaveProperty('frames');
    expect(result).toHaveProperty('video');
    expect(result).toHaveProperty('meta');
  });

  it('frames array length matches extracted frames', async () => {
    const result = await sample('/test.mp4');
    expect(result.frames).toHaveLength(8);
  });

  it('each frame has required SampledFrame fields', async () => {
    const result = await sample('/test.mp4');
    const frame = result.frames[0];

    expect(frame).toHaveProperty('buffer');
    expect(frame).toHaveProperty('timestamp');
    expect(frame).toHaveProperty('index');
    expect(frame).toHaveProperty('mimeType');
    expect(frame).toHaveProperty('width');
    expect(frame).toHaveProperty('height');
    expect(frame).toHaveProperty('byteLength');
    expect(frame).toHaveProperty('isSceneChange');
    expect(frame.isSceneChange).toBe(false);
  });

  it('video field matches probed VideoInfo', async () => {
    const result = await sample('/test.mp4');
    expect(result.video.path).toBe('/test.mp4');
    expect(result.video.width).toBe(1920);
    expect(result.video.height).toBe(1080);
    expect(result.video.duration).toBe(60);
    expect(result.video.fps).toBe(30);
    expect(result.video.codec).toBe('h264');
  });

  it('meta contains strategy, processingTimeMs, candidatesEvaluated', async () => {
    const result = await sample('/test.mp4');
    expect(result.meta.strategy).toBe('uniform');
    expect(typeof result.meta.processingTimeMs).toBe('number');
    expect(result.meta.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.meta.candidatesEvaluated).toBeGreaterThan(0);
    expect(result.meta.framesDeduped).toBe(0);
    expect(result.meta.sceneChangesDetected).toBe(0);
  });

  it('frames have correct mimeType for jpeg output', async () => {
    const result = await sample('/test.mp4', { outputFormat: 'jpeg' });
    expect(result.frames[0].mimeType).toBe('image/jpeg');
  });

  it('frames have correct mimeType for png output', async () => {
    const result = await sample('/test.mp4', { outputFormat: 'png' });
    expect(result.frames[0].mimeType).toBe('image/png');
  });

  it('includes base64 when outputBase64 is true', async () => {
    const result = await sample('/test.mp4', { outputBase64: true });
    expect(result.frames[0].base64).toBeDefined();
    expect(typeof result.frames[0].base64).toBe('string');
  });

  it('does not include base64 by default', async () => {
    const result = await sample('/test.mp4');
    expect(result.frames[0].base64).toBeUndefined();
  });

  it('frame index is sequential starting at 0', async () => {
    const result = await sample('/test.mp4');
    result.frames.forEach((frame, idx) => {
      expect(frame.index).toBe(idx);
    });
  });

  it('respects strategy option', async () => {
    const result = await sample('/test.mp4', { strategy: 'interval', intervalSeconds: 10 });
    expect(result.meta.strategy).toBe('interval');
  });
});
