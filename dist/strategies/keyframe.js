"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyframeTimestamps = keyframeTimestamps;
// Typical GOP size is around 2 seconds (keyframe every ~2s)
const DEFAULT_GOP_SECONDS = 2;
function keyframeTimestamps(duration, fps, maxFrames) {
    void fps; // fps available for future use; GOP estimate uses fixed interval
    if (duration <= 0)
        return [0];
    const timestamps = [];
    let t = 0;
    while (t <= duration) {
        timestamps.push(Math.min(t, duration));
        t += DEFAULT_GOP_SECONDS;
    }
    // ensure final frame
    const last = timestamps[timestamps.length - 1];
    if (last < duration) {
        timestamps.push(duration);
    }
    const unique = [...new Set(timestamps)];
    if (maxFrames !== undefined && unique.length > maxFrames) {
        return unique.slice(0, maxFrames);
    }
    return unique;
}
//# sourceMappingURL=keyframe.js.map