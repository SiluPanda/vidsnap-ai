"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const errors_1 = require("../errors");
// ── VideoNotFoundError ────────────────────────────────────────────────────────
(0, vitest_1.describe)('VideoNotFoundError', () => {
    (0, vitest_1.it)('has name "VideoNotFoundError"', () => {
        const err = new errors_1.VideoNotFoundError('/tmp/missing.mp4');
        (0, vitest_1.expect)(err.name).toBe('VideoNotFoundError');
    });
    (0, vitest_1.it)('message contains the file path', () => {
        const path = '/some/path/video.mp4';
        const err = new errors_1.VideoNotFoundError(path);
        (0, vitest_1.expect)(err.message).toContain(path);
    });
    (0, vitest_1.it)('exposes filePath property', () => {
        const path = '/videos/clip.mov';
        const err = new errors_1.VideoNotFoundError(path);
        (0, vitest_1.expect)(err.filePath).toBe(path);
    });
    (0, vitest_1.it)('is an instance of Error', () => {
        const err = new errors_1.VideoNotFoundError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).toBeInstanceOf(Error);
    });
    (0, vitest_1.it)('is an instance of VideoNotFoundError', () => {
        const err = new errors_1.VideoNotFoundError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).toBeInstanceOf(errors_1.VideoNotFoundError);
    });
    (0, vitest_1.it)('has correct prototype chain', () => {
        const err = new errors_1.VideoNotFoundError('/tmp/x.mp4');
        (0, vitest_1.expect)(Object.getPrototypeOf(err)).toBe(errors_1.VideoNotFoundError.prototype);
    });
});
// ── InvalidVideoError ─────────────────────────────────────────────────────────
(0, vitest_1.describe)('InvalidVideoError', () => {
    (0, vitest_1.it)('has name "InvalidVideoError"', () => {
        const err = new errors_1.InvalidVideoError('/tmp/bad.mp4');
        (0, vitest_1.expect)(err.name).toBe('InvalidVideoError');
    });
    (0, vitest_1.it)('message contains the file path', () => {
        const path = '/corrupt/video.mp4';
        const err = new errors_1.InvalidVideoError(path);
        (0, vitest_1.expect)(err.message).toContain(path);
    });
    (0, vitest_1.it)('includes reason in message when provided', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4', 'missing moov atom');
        (0, vitest_1.expect)(err.message).toContain('missing moov atom');
    });
    (0, vitest_1.it)('does not include reason text when reason is absent', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        // message should not have a parenthetical reason segment
        (0, vitest_1.expect)(err.message).not.toContain('(');
        (0, vitest_1.expect)(err.message).not.toContain(')');
    });
    (0, vitest_1.it)('exposes filePath property', () => {
        const path = '/videos/corrupted.avi';
        const err = new errors_1.InvalidVideoError(path);
        (0, vitest_1.expect)(err.filePath).toBe(path);
    });
    (0, vitest_1.it)('exposes reason property when provided', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4', 'unsupported codec');
        (0, vitest_1.expect)(err.reason).toBe('unsupported codec');
    });
    (0, vitest_1.it)('reason property is undefined when not provided', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        (0, vitest_1.expect)(err.reason).toBeUndefined();
    });
    (0, vitest_1.it)('is an instance of Error', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).toBeInstanceOf(Error);
    });
    (0, vitest_1.it)('is an instance of InvalidVideoError', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).toBeInstanceOf(errors_1.InvalidVideoError);
    });
    (0, vitest_1.it)('has correct prototype chain', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        (0, vitest_1.expect)(Object.getPrototypeOf(err)).toBe(errors_1.InvalidVideoError.prototype);
    });
});
// ── FfmpegNotFoundError ───────────────────────────────────────────────────────
(0, vitest_1.describe)('FfmpegNotFoundError', () => {
    (0, vitest_1.it)('has name "FfmpegNotFoundError"', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err.name).toBe('FfmpegNotFoundError');
    });
    (0, vitest_1.it)('message contains "ffmpeg"', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err.message.toLowerCase()).toContain('ffmpeg');
    });
    (0, vitest_1.it)('message contains macOS install hint (brew)', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err.message).toContain('brew');
    });
    (0, vitest_1.it)('message contains Ubuntu install hint (apt-get)', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err.message).toContain('apt-get');
    });
    (0, vitest_1.it)('message contains Windows install hint (choco)', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err.message).toContain('choco');
    });
    (0, vitest_1.it)('constructor takes no arguments', () => {
        // This is a compile-time and runtime check: no args required
        (0, vitest_1.expect)(() => new errors_1.FfmpegNotFoundError()).not.toThrow();
    });
    (0, vitest_1.it)('is an instance of Error', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err).toBeInstanceOf(Error);
    });
    (0, vitest_1.it)('is an instance of FfmpegNotFoundError', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err).toBeInstanceOf(errors_1.FfmpegNotFoundError);
    });
    (0, vitest_1.it)('has correct prototype chain', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(Object.getPrototypeOf(err)).toBe(errors_1.FfmpegNotFoundError.prototype);
    });
});
// ── All three error classes: cross-checks ────────────────────────────────────
(0, vitest_1.describe)('All error classes', () => {
    (0, vitest_1.it)('VideoNotFoundError is not instanceof InvalidVideoError', () => {
        const err = new errors_1.VideoNotFoundError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.InvalidVideoError);
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.FfmpegNotFoundError);
    });
    (0, vitest_1.it)('InvalidVideoError is not instanceof VideoNotFoundError', () => {
        const err = new errors_1.InvalidVideoError('/tmp/x.mp4');
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.VideoNotFoundError);
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.FfmpegNotFoundError);
    });
    (0, vitest_1.it)('FfmpegNotFoundError is not instanceof VideoNotFoundError or InvalidVideoError', () => {
        const err = new errors_1.FfmpegNotFoundError();
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.VideoNotFoundError);
        (0, vitest_1.expect)(err).not.toBeInstanceOf(errors_1.InvalidVideoError);
    });
    (0, vitest_1.it)('all three can be caught as Error', () => {
        const errors = [
            new errors_1.VideoNotFoundError('/a'),
            new errors_1.InvalidVideoError('/b'),
            new errors_1.FfmpegNotFoundError(),
        ];
        errors.forEach(err => {
            (0, vitest_1.expect)(err).toBeInstanceOf(Error);
            (0, vitest_1.expect)(typeof err.message).toBe('string');
            (0, vitest_1.expect)(err.message.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=errors.test.js.map