"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const errors_1 = require("../../errors");
// Mock fluent-ffmpeg before importing the module under test
vitest_1.vi.mock('fluent-ffmpeg', () => {
    const ffprobeMock = vitest_1.vi.fn();
    const mod = ffprobeMock;
    mod.ffprobe = ffprobeMock;
    return { default: mod };
});
// Must import AFTER the mock is registered
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffprobe_1 = require("../../video/ffprobe");
const mockFfprobe = fluent_ffmpeg_1.default.ffprobe;
const MOCK_METADATA = {
    streams: [
        {
            codec_type: 'video',
            codec_name: 'h264',
            width: 1920,
            height: 1080,
            r_frame_rate: '30/1',
            nb_frames: '1800',
            duration: '60',
        },
        {
            codec_type: 'audio',
            codec_name: 'aac',
        },
    ],
    format: {
        duration: '60',
        bit_rate: '5000000',
        size: '100000000',
        format_name: 'mp4,mov',
    },
};
(0, vitest_1.describe)('probeVideo', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('returns a VideoInfo object with correct fields', async () => {
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(null, MOCK_METADATA);
        });
        const info = await (0, ffprobe_1.probeVideo)('/test.mp4');
        (0, vitest_1.expect)(info.path).toBe('/test.mp4');
        (0, vitest_1.expect)(info.width).toBe(1920);
        (0, vitest_1.expect)(info.height).toBe(1080);
        (0, vitest_1.expect)(info.duration).toBe(60);
        (0, vitest_1.expect)(info.fps).toBe(30);
        (0, vitest_1.expect)(info.codec).toBe('h264');
        (0, vitest_1.expect)(info.bitrate).toBe(5000000);
        (0, vitest_1.expect)(info.fileSize).toBe(100000000);
        (0, vitest_1.expect)(info.format).toBe('mp4');
        (0, vitest_1.expect)(info.hasAudio).toBe(true);
        (0, vitest_1.expect)(info.totalFrames).toBe(1800);
    });
    (0, vitest_1.it)('parses fractional fps correctly (e.g. 24000/1001 ≈ 23.976)', async () => {
        const metadata = {
            ...MOCK_METADATA,
            streams: [
                { ...MOCK_METADATA.streams[0], r_frame_rate: '24000/1001', nb_frames: undefined },
            ],
            format: { ...MOCK_METADATA.format },
        };
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(null, metadata);
        });
        const info = await (0, ffprobe_1.probeVideo)('/test.mp4');
        (0, vitest_1.expect)(info.fps).toBeCloseTo(23.976, 2);
    });
    (0, vitest_1.it)('sets hasAudio to false when no audio stream', async () => {
        const metadata = {
            streams: [MOCK_METADATA.streams[0]],
            format: MOCK_METADATA.format,
        };
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(null, metadata);
        });
        const info = await (0, ffprobe_1.probeVideo)('/test.mp4');
        (0, vitest_1.expect)(info.hasAudio).toBe(false);
    });
    (0, vitest_1.it)('throws VideoNotFoundError when error contains "No such file"', async () => {
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(new Error('No such file or directory'), null);
        });
        await (0, vitest_1.expect)((0, ffprobe_1.probeVideo)('/missing.mp4')).rejects.toBeInstanceOf(errors_1.VideoNotFoundError);
    });
    (0, vitest_1.it)('throws VideoNotFoundError when error contains "does not exist"', async () => {
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(new Error('File does not exist'), null);
        });
        await (0, vitest_1.expect)((0, ffprobe_1.probeVideo)('/missing.mp4')).rejects.toBeInstanceOf(errors_1.VideoNotFoundError);
    });
    (0, vitest_1.it)('throws FfmpegNotFoundError when ffprobe is not found', async () => {
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(new Error('ffprobe not found in PATH'), null);
        });
        await (0, vitest_1.expect)((0, ffprobe_1.probeVideo)('/test.mp4')).rejects.toBeInstanceOf(errors_1.FfmpegNotFoundError);
    });
    (0, vitest_1.it)('rethrows other errors as-is', async () => {
        const originalError = new Error('unexpected codec error');
        mockFfprobe.mockImplementation((_path, cb) => {
            cb(originalError, null);
        });
        await (0, vitest_1.expect)((0, ffprobe_1.probeVideo)('/test.mp4')).rejects.toBe(originalError);
    });
});
//# sourceMappingURL=ffprobe.test.js.map