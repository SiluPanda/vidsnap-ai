"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample = sample;
const crypto_1 = require("crypto");
const info_1 = require("./info");
const strategies_1 = require("./strategies");
const frame_extractor_1 = require("./video/frame-extractor");
const tmp_utils_1 = require("./video/tmp-utils");
const DEFAULTS = {
    strategy: 'uniform',
    count: 8,
    outputFormat: 'jpeg',
    outputBase64: false,
    maxFrames: 50,
    minFrames: 1,
};
async function sample(video, options) {
    const startMs = Date.now();
    const resolvedOptions = { ...DEFAULTS, ...options };
    const strategy = resolvedOptions.strategy ?? 'uniform';
    const outputBase64 = resolvedOptions.outputBase64 ?? false;
    const outputFormat = resolvedOptions.outputFormat ?? 'jpeg';
    // Resolve file path — write to tmp if Buffer
    let filePath;
    let tmpCreated = false;
    if (Buffer.isBuffer(video)) {
        filePath = (0, tmp_utils_1.writeTmpFile)(video, 'mp4');
        tmpCreated = true;
    }
    else {
        filePath = video;
    }
    try {
        const videoInfo = await (0, info_1.getVideoInfo)(filePath);
        const timestamps = await (0, strategies_1.getTimestamps)(strategy, videoInfo, resolvedOptions);
        const format = outputFormat === 'jpeg' ? 'jpg' : 'png';
        const rawFrames = await (0, frame_extractor_1.extractFrames)(filePath, {
            timestamps,
            width: videoInfo.width,
            height: videoInfo.height,
            format,
        });
        const frames = rawFrames.map((raw, idx) => {
            void (0, crypto_1.randomUUID)(); // id not in SampledFrame interface
            const frame = {
                buffer: raw.data,
                timestamp: raw.timestamp,
                index: idx,
                mimeType: outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
                width: raw.width || videoInfo.width,
                height: raw.height || videoInfo.height,
                byteLength: raw.data.length,
                isSceneChange: false,
            };
            if (outputBase64) {
                frame.base64 = raw.data.toString('base64');
            }
            return frame;
        });
        const processingTimeMs = Date.now() - startMs;
        return {
            frames,
            video: videoInfo,
            meta: {
                strategy,
                candidatesEvaluated: timestamps.length,
                framesDeduped: 0,
                sceneChangesDetected: 0,
                processingTimeMs,
            },
        };
    }
    finally {
        if (tmpCreated) {
            (0, tmp_utils_1.cleanTmpFile)(filePath);
        }
    }
}
//# sourceMappingURL=sample.js.map