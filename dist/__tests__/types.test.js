"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ── SamplingStrategy union ────────────────────────────────────────────────────
(0, vitest_1.describe)('SamplingStrategy', () => {
    (0, vitest_1.it)('accepts all 7 valid strategy values', () => {
        const strategies = [
            'interval',
            'scene',
            'keyframe',
            'hybrid',
            'uniform',
            'budget',
            'custom',
        ];
        (0, vitest_1.expect)(strategies).toHaveLength(7);
        strategies.forEach(s => (0, vitest_1.expect)(typeof s).toBe('string'));
    });
});
// ── SceneAlgorithm union ──────────────────────────────────────────────────────
(0, vitest_1.describe)('SceneAlgorithm', () => {
    (0, vitest_1.it)('covers all 4 algorithm values', () => {
        const algorithms = ['histogram', 'pixel', 'phash', 'ssim'];
        (0, vitest_1.expect)(algorithms).toHaveLength(4);
        algorithms.forEach(a => (0, vitest_1.expect)(typeof a).toBe('string'));
    });
});
// ── VideoInfo required shape ──────────────────────────────────────────────────
(0, vitest_1.describe)('VideoInfo', () => {
    (0, vitest_1.it)('accepts a fully populated VideoInfo object', () => {
        const info = {
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
        (0, vitest_1.expect)(info.path).toBe('/tmp/test.mp4');
        (0, vitest_1.expect)(info.duration).toBe(120.5);
        (0, vitest_1.expect)(info.fps).toBe(29.97);
        (0, vitest_1.expect)(info.width).toBe(1920);
        (0, vitest_1.expect)(info.height).toBe(1080);
        (0, vitest_1.expect)(info.codec).toBe('h264');
        (0, vitest_1.expect)(info.totalFrames).toBe(3612);
        (0, vitest_1.expect)(info.fileSize).toBe(52428800);
        (0, vitest_1.expect)(info.bitrate).toBe(3500000);
        (0, vitest_1.expect)(info.hasAudio).toBe(true);
        (0, vitest_1.expect)(info.format).toBe('mp4');
    });
});
// ── SampledFrame shape ────────────────────────────────────────────────────────
(0, vitest_1.describe)('SampledFrame', () => {
    (0, vitest_1.it)('has required fields: timestamp, index, buffer, mimeType, width, height, byteLength, isSceneChange', () => {
        const frame = {
            buffer: Buffer.from('fake-image-data'),
            timestamp: 5.0,
            index: 0,
            mimeType: 'image/jpeg',
            width: 1920,
            height: 1080,
            byteLength: 15,
            isSceneChange: false,
        };
        (0, vitest_1.expect)(frame.timestamp).toBe(5.0);
        (0, vitest_1.expect)(frame.index).toBe(0);
        (0, vitest_1.expect)(Buffer.isBuffer(frame.buffer)).toBe(true);
        (0, vitest_1.expect)(frame.mimeType).toBe('image/jpeg');
        (0, vitest_1.expect)(frame.width).toBe(1920);
        (0, vitest_1.expect)(frame.height).toBe(1080);
        (0, vitest_1.expect)(frame.byteLength).toBe(15);
        (0, vitest_1.expect)(frame.isSceneChange).toBe(false);
    });
    (0, vitest_1.it)('accepts optional fields: base64, sceneChangeScore, similarity, tokens, cost, contentBlock', () => {
        const frame = {
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
        (0, vitest_1.expect)(frame.base64).toBe('abc123');
        (0, vitest_1.expect)(frame.sceneChangeScore).toBe(0.75);
        (0, vitest_1.expect)(frame.similarity).toBe(0.2);
        (0, vitest_1.expect)(frame.tokens).toBe(765);
        (0, vitest_1.expect)(frame.cost).toBe(0.001913);
        (0, vitest_1.expect)(frame.contentBlock).toEqual({ type: 'image_url' });
        (0, vitest_1.expect)(frame.isSceneChange).toBe(true);
    });
});
// ── SampleOptions all-optional ────────────────────────────────────────────────
(0, vitest_1.describe)('SampleOptions', () => {
    (0, vitest_1.it)('can be constructed with no fields (all optional)', () => {
        const opts = {};
        (0, vitest_1.expect)(opts).toBeDefined();
    });
    (0, vitest_1.it)('accepts all optional fields', () => {
        const selector = (info) => [0, info.duration / 2, info.duration - 1];
        const opts = {
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
        (0, vitest_1.expect)(opts.strategy).toBe('hybrid');
        (0, vitest_1.expect)(opts.maxFrames).toBe(20);
        (0, vitest_1.expect)(opts.selector).toBe(selector);
    });
});
// ── SamplerConfig all-optional (extends SampleOptions) ───────────────────────
(0, vitest_1.describe)('SamplerConfig', () => {
    (0, vitest_1.it)('can be constructed with no fields', () => {
        const config = {};
        (0, vitest_1.expect)(config).toBeDefined();
    });
    (0, vitest_1.it)('accepts SampleOptions fields as defaults', () => {
        const config = {
            strategy: 'scene',
            maxFrames: 15,
            dedup: true,
            outputBase64: true,
            provider: 'anthropic',
        };
        (0, vitest_1.expect)(config.strategy).toBe('scene');
        (0, vitest_1.expect)(config.provider).toBe('anthropic');
    });
});
// ── VideoSampler interface mock ───────────────────────────────────────────────
(0, vitest_1.describe)('VideoSampler', () => {
    (0, vitest_1.it)('can be mock-implemented', async () => {
        const mockVideoInfo = {
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
        const mockSampleMeta = {
            strategy: 'uniform',
            candidatesEvaluated: 10,
            framesDeduped: 0,
            sceneChangesDetected: 0,
            processingTimeMs: 150,
        };
        const mockResult = {
            frames: [],
            video: mockVideoInfo,
            meta: mockSampleMeta,
        };
        const mockSceneChange = {
            timestamp: 5.0,
            score: 0.65,
            algorithm: 'histogram',
            frameIndex: 20,
        };
        const sampler = {
            sample: async (_video, _options) => mockResult,
            sampleStream: (function* () { return; })(),
            detectScenes: async (_video, _options) => [mockSceneChange],
            getVideoInfo: async (_video) => mockVideoInfo,
        };
        const result = await sampler.sample('./test.mp4');
        (0, vitest_1.expect)(result.frames).toEqual([]);
        (0, vitest_1.expect)(result.video.codec).toBe('h264');
        (0, vitest_1.expect)(result.meta.strategy).toBe('uniform');
        const scenes = await sampler.detectScenes('./test.mp4');
        (0, vitest_1.expect)(scenes).toHaveLength(1);
        (0, vitest_1.expect)(scenes[0].algorithm).toBe('histogram');
        (0, vitest_1.expect)(scenes[0].frameIndex).toBe(20);
        const info = await sampler.getVideoInfo('./test.mp4');
        (0, vitest_1.expect)(info.duration).toBe(60);
        (0, vitest_1.expect)(info.hasAudio).toBe(false);
    });
});
// ── SceneDetectOptions ────────────────────────────────────────────────────────
(0, vitest_1.describe)('SceneDetectOptions', () => {
    (0, vitest_1.it)('can be constructed with no fields (all optional)', () => {
        const opts = {};
        (0, vitest_1.expect)(opts).toBeDefined();
    });
    (0, vitest_1.it)('accepts all optional fields', () => {
        const opts = {
            algorithm: 'ssim',
            algorithms: ['histogram', 'ssim'],
            consensus: 2,
            threshold: 0.25,
            analyzeInterval: 0.5,
        };
        (0, vitest_1.expect)(opts.algorithm).toBe('ssim');
        (0, vitest_1.expect)(opts.threshold).toBe(0.25);
    });
});
// ── VideoSource type ──────────────────────────────────────────────────────────
(0, vitest_1.describe)('VideoSource', () => {
    (0, vitest_1.it)('accepts a string path', () => {
        const src = '/path/to/video.mp4';
        (0, vitest_1.expect)(typeof src).toBe('string');
    });
    (0, vitest_1.it)('accepts a Buffer', () => {
        const src = Buffer.from([0xff, 0xd8, 0xff]);
        (0, vitest_1.expect)(Buffer.isBuffer(src)).toBe(true);
    });
});
// ── FrameSelector type ────────────────────────────────────────────────────────
(0, vitest_1.describe)('FrameSelector', () => {
    (0, vitest_1.it)('can be a sync function returning number[]', () => {
        const info = {
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
        const selector = (videoInfo) => [0, videoInfo.duration / 2];
        const result = selector(info);
        (0, vitest_1.expect)(Array.isArray(result)).toBe(true);
        (0, vitest_1.expect)(result).toEqual([0, 15]);
    });
    (0, vitest_1.it)('can be an async function returning Promise<number[]>', async () => {
        const info = {
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
        const selector = async (videoInfo) => [0, videoInfo.duration - 1];
        const result = await selector(info);
        (0, vitest_1.expect)(result).toEqual([0, 59]);
    });
});
//# sourceMappingURL=types.test.js.map