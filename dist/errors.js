"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FfmpegNotFoundError = exports.InvalidVideoError = exports.VideoNotFoundError = void 0;
class VideoNotFoundError extends Error {
    filePath;
    name = 'VideoNotFoundError';
    constructor(filePath) {
        super(`Video file not found: ${filePath}`);
        this.filePath = filePath;
        Object.setPrototypeOf(this, VideoNotFoundError.prototype);
    }
}
exports.VideoNotFoundError = VideoNotFoundError;
class InvalidVideoError extends Error {
    filePath;
    reason;
    name = 'InvalidVideoError';
    constructor(filePath, reason) {
        super(`Invalid or corrupted video file: ${filePath}${reason ? ` (${reason})` : ''}`);
        this.filePath = filePath;
        this.reason = reason;
        Object.setPrototypeOf(this, InvalidVideoError.prototype);
    }
}
exports.InvalidVideoError = InvalidVideoError;
class FfmpegNotFoundError extends Error {
    name = 'FfmpegNotFoundError';
    constructor() {
        super('ffmpeg/ffprobe not found. Install ffmpeg:\n' +
            '  macOS:   brew install ffmpeg\n' +
            '  Ubuntu:  sudo apt-get install ffmpeg\n' +
            '  Windows: choco install ffmpeg  OR  winget install ffmpeg');
        Object.setPrototypeOf(this, FfmpegNotFoundError.prototype);
    }
}
exports.FfmpegNotFoundError = FfmpegNotFoundError;
//# sourceMappingURL=errors.js.map