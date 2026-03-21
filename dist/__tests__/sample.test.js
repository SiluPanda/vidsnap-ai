"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../video/ffprobe', () => ({
    probeVideo: vitest_1.vi.fn().mockResolvedValue({
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
vitest_1.vi.mock('../video/frame-extractor', () => ({
    extractFrames: vitest_1.vi.fn().mockResolvedValue([
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
const sample_1 = require("../sample");
(0, vitest_1.describe)('sample()', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('returns a SampleResult with frames, video, meta', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        (0, vitest_1.expect)(result).toHaveProperty('frames');
        (0, vitest_1.expect)(result).toHaveProperty('video');
        (0, vitest_1.expect)(result).toHaveProperty('meta');
    });
    (0, vitest_1.it)('frames array length matches extracted frames', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        (0, vitest_1.expect)(result.frames).toHaveLength(8);
    });
    (0, vitest_1.it)('each frame has required SampledFrame fields', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        const frame = result.frames[0];
        (0, vitest_1.expect)(frame).toHaveProperty('buffer');
        (0, vitest_1.expect)(frame).toHaveProperty('timestamp');
        (0, vitest_1.expect)(frame).toHaveProperty('index');
        (0, vitest_1.expect)(frame).toHaveProperty('mimeType');
        (0, vitest_1.expect)(frame).toHaveProperty('width');
        (0, vitest_1.expect)(frame).toHaveProperty('height');
        (0, vitest_1.expect)(frame).toHaveProperty('byteLength');
        (0, vitest_1.expect)(frame).toHaveProperty('isSceneChange');
        (0, vitest_1.expect)(frame.isSceneChange).toBe(false);
    });
    (0, vitest_1.it)('video field matches probed VideoInfo', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        (0, vitest_1.expect)(result.video.path).toBe('/test.mp4');
        (0, vitest_1.expect)(result.video.width).toBe(1920);
        (0, vitest_1.expect)(result.video.height).toBe(1080);
        (0, vitest_1.expect)(result.video.duration).toBe(60);
        (0, vitest_1.expect)(result.video.fps).toBe(30);
        (0, vitest_1.expect)(result.video.codec).toBe('h264');
    });
    (0, vitest_1.it)('meta contains strategy, processingTimeMs, candidatesEvaluated', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        (0, vitest_1.expect)(result.meta.strategy).toBe('uniform');
        (0, vitest_1.expect)(typeof result.meta.processingTimeMs).toBe('number');
        (0, vitest_1.expect)(result.meta.processingTimeMs).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(result.meta.candidatesEvaluated).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.meta.framesDeduped).toBe(0);
        (0, vitest_1.expect)(result.meta.sceneChangesDetected).toBe(0);
    });
    (0, vitest_1.it)('frames have correct mimeType for jpeg output', async () => {
        const result = await (0, sample_1.sample)('/test.mp4', { outputFormat: 'jpeg' });
        (0, vitest_1.expect)(result.frames[0].mimeType).toBe('image/jpeg');
    });
    (0, vitest_1.it)('frames have correct mimeType for png output', async () => {
        const result = await (0, sample_1.sample)('/test.mp4', { outputFormat: 'png' });
        (0, vitest_1.expect)(result.frames[0].mimeType).toBe('image/png');
    });
    (0, vitest_1.it)('includes base64 when outputBase64 is true', async () => {
        const result = await (0, sample_1.sample)('/test.mp4', { outputBase64: true });
        (0, vitest_1.expect)(result.frames[0].base64).toBeDefined();
        (0, vitest_1.expect)(typeof result.frames[0].base64).toBe('string');
    });
    (0, vitest_1.it)('does not include base64 by default', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        (0, vitest_1.expect)(result.frames[0].base64).toBeUndefined();
    });
    (0, vitest_1.it)('frame index is sequential starting at 0', async () => {
        const result = await (0, sample_1.sample)('/test.mp4');
        result.frames.forEach((frame, idx) => {
            (0, vitest_1.expect)(frame.index).toBe(idx);
        });
    });
    (0, vitest_1.it)('respects strategy option', async () => {
        const result = await (0, sample_1.sample)('/test.mp4', { strategy: 'interval', intervalSeconds: 10 });
        (0, vitest_1.expect)(result.meta.strategy).toBe('interval');
    });
});
//# sourceMappingURL=sample.test.js.map