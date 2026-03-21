"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniformTimestamps = uniformTimestamps;
function uniformTimestamps(duration, count) {
    if (count <= 0)
        return [];
    if (count === 1)
        return [duration / 2];
    const timestamps = [];
    for (let i = 0; i < count; i++) {
        timestamps.push((i / (count - 1)) * duration);
    }
    return timestamps;
}
//# sourceMappingURL=uniform.js.map