"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTimestamps = exports.keyframeTimestamps = exports.uniformTimestamps = exports.intervalTimestamps = void 0;
exports.getTimestamps = getTimestamps;
const interval_1 = require("./interval");
const uniform_1 = require("./uniform");
const keyframe_1 = require("./keyframe");
const custom_1 = require("./custom");
var interval_2 = require("./interval");
Object.defineProperty(exports, "intervalTimestamps", { enumerable: true, get: function () { return interval_2.intervalTimestamps; } });
var uniform_2 = require("./uniform");
Object.defineProperty(exports, "uniformTimestamps", { enumerable: true, get: function () { return uniform_2.uniformTimestamps; } });
var keyframe_2 = require("./keyframe");
Object.defineProperty(exports, "keyframeTimestamps", { enumerable: true, get: function () { return keyframe_2.keyframeTimestamps; } });
var custom_2 = require("./custom");
Object.defineProperty(exports, "customTimestamps", { enumerable: true, get: function () { return custom_2.customTimestamps; } });
async function getTimestamps(strategy, videoInfo, options) {
    const { duration, fps } = videoInfo;
    const maxFrames = options.maxFrames;
    const minFrames = options.minFrames ?? 1;
    let timestamps;
    switch (strategy) {
        case 'interval': {
            const intervalSecs = options.intervalSeconds ?? 1.0;
            timestamps = (0, interval_1.intervalTimestamps)(duration, intervalSecs, maxFrames);
            break;
        }
        case 'keyframe': {
            timestamps = (0, keyframe_1.keyframeTimestamps)(duration, fps, maxFrames);
            break;
        }
        case 'custom': {
            if (!options.selector) {
                // fall back to uniform if no selector
                timestamps = (0, uniform_1.uniformTimestamps)(duration, options.count ?? 10);
            }
            else {
                timestamps = await (0, custom_1.customTimestamps)(duration, options.selector, videoInfo);
            }
            break;
        }
        case 'uniform':
        case 'scene':
        case 'hybrid':
        case 'budget':
        default: {
            const count = options.count ?? 10;
            timestamps = (0, uniform_1.uniformTimestamps)(duration, count);
            break;
        }
    }
    // apply maxFrames cap
    if (maxFrames !== undefined && timestamps.length > maxFrames) {
        timestamps = timestamps.slice(0, maxFrames);
    }
    // apply minFrames padding (duplicate last timestamp if needed)
    while (timestamps.length < minFrames) {
        const last = timestamps[timestamps.length - 1] ?? 0;
        timestamps.push(last);
    }
    return timestamps;
}
//# sourceMappingURL=index.js.map