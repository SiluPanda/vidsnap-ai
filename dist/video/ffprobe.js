"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeVideo = probeVideo;
exports.checkFfmpegAvailable = checkFfmpegAvailable;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const child_process_1 = require("child_process");
const errors_1 = require("../errors");
function evalFps(rFrameRate) {
    if (!rFrameRate || !rFrameRate.includes('/')) {
        return parseFloat(rFrameRate) || 0;
    }
    const [num, den] = rFrameRate.split('/').map(Number);
    if (!den || den === 0)
        return num || 0;
    return num / den;
}
async function probeVideo(filePath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
            if (err) {
                const msg = err.message ?? String(err);
                if (msg.includes('No such file') || msg.includes('does not exist')) {
                    reject(new errors_1.VideoNotFoundError(filePath));
                }
                else if (msg.toLowerCase().includes('ffprobe') && msg.toLowerCase().includes('not found')) {
                    reject(new errors_1.FfmpegNotFoundError());
                }
                else {
                    reject(err);
                }
                return;
            }
            const streams = metadata.streams ?? [];
            const videoStream = streams.find((s) => s.codec_type === 'video');
            const audioStream = streams.find((s) => s.codec_type === 'audio');
            const fmt = metadata.format ?? {};
            const width = videoStream?.width ?? 0;
            const height = videoStream?.height ?? 0;
            const duration = parseFloat(String(fmt.duration ?? videoStream?.duration ?? '0'));
            const fps = videoStream?.r_frame_rate ? evalFps(videoStream.r_frame_rate) : 0;
            const codec = videoStream?.codec_name ?? '';
            const bitrate = parseInt(String(fmt.bit_rate ?? '0'), 10);
            const fileSize = parseInt(String(fmt.size ?? '0'), 10);
            const format = (fmt.format_name ?? '').split(',')[0];
            const hasAudio = audioStream !== undefined;
            // rotation from tags
            const tags = videoStream?.['tags'];
            const rotationStr = tags?.['rotate'] ?? '0';
            const rotation = parseInt(rotationStr, 10) || 0;
            void rotation; // available but not part of VideoInfo interface
            const totalFrames = videoStream?.nb_frames
                ? parseInt(String(videoStream.nb_frames), 10)
                : Math.round(duration * fps);
            resolve({
                path: filePath,
                duration,
                width,
                height,
                fps,
                codec,
                totalFrames,
                fileSize,
                bitrate,
                hasAudio,
                format,
            });
        });
    });
}
async function checkFfmpegAvailable() {
    return new Promise((resolve) => {
        const proc = (0, child_process_1.spawn)('ffmpeg', ['-version'], { stdio: 'ignore' });
        proc.on('error', () => resolve(false));
        proc.on('close', (code) => resolve(code === 0));
    });
}
//# sourceMappingURL=ffprobe.js.map