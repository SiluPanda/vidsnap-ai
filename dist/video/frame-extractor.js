"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFrames = extractFrames;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
function extractSingleFrame(filePath, timestamp, outputPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(filePath)
            .seekInput(timestamp)
            .frames(1)
            .outputOptions(['-q:v', '2'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
    });
}
async function extractFrames(filePath, options) {
    const { timestamps, width = 0, height = 0, format = 'jpg' } = options;
    const tmpDir = (0, path_1.join)((0, os_1.tmpdir)(), `vidsnap-${(0, crypto_1.randomUUID)()}`);
    (0, fs_1.mkdirSync)(tmpDir, { recursive: true });
    try {
        const results = [];
        for (let i = 0; i < timestamps.length; i++) {
            const ts = timestamps[i];
            const outputPath = (0, path_1.join)(tmpDir, `frame_${i}.${format}`);
            await extractSingleFrame(filePath, ts, outputPath);
            const data = (0, fs_1.readFileSync)(outputPath);
            results.push({ timestamp: ts, data, width, height });
        }
        // sort by timestamp
        results.sort((a, b) => a.timestamp - b.timestamp);
        return results;
    }
    finally {
        try {
            (0, fs_1.rmSync)(tmpDir, { recursive: true, force: true });
        }
        catch {
            // silently ignore cleanup errors
        }
    }
}
//# sourceMappingURL=frame-extractor.js.map