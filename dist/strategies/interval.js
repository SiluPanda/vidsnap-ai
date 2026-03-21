"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intervalTimestamps = intervalTimestamps;
function intervalTimestamps(duration, intervalSecs, maxFrames) {
    if (duration <= 0 || intervalSecs <= 0)
        return [0];
    const timestamps = [];
    let t = 0;
    while (t <= duration) {
        timestamps.push(Math.min(t, duration));
        t += intervalSecs;
    }
    // ensure final frame is included
    const last = timestamps[timestamps.length - 1];
    if (last < duration) {
        timestamps.push(duration);
    }
    // deduplicate
    const unique = [...new Set(timestamps)];
    if (maxFrames !== undefined && unique.length > maxFrames) {
        return unique.slice(0, maxFrames);
    }
    return unique;
}
//# sourceMappingURL=interval.js.map