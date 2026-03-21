"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTimestamps = customTimestamps;
async function customTimestamps(duration, selector, videoInfo) {
    void duration; // available to selector via videoInfo.duration
    const result = selector(videoInfo);
    return Promise.resolve(result);
}
//# sourceMappingURL=custom.js.map