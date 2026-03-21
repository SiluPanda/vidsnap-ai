"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTimestamps = exports.keyframeTimestamps = exports.uniformTimestamps = exports.intervalTimestamps = exports.getVideoInfo = exports.sample = exports.createSampler = exports.FfmpegNotFoundError = exports.InvalidVideoError = exports.VideoNotFoundError = void 0;
var errors_1 = require("./errors");
Object.defineProperty(exports, "VideoNotFoundError", { enumerable: true, get: function () { return errors_1.VideoNotFoundError; } });
Object.defineProperty(exports, "InvalidVideoError", { enumerable: true, get: function () { return errors_1.InvalidVideoError; } });
Object.defineProperty(exports, "FfmpegNotFoundError", { enumerable: true, get: function () { return errors_1.FfmpegNotFoundError; } });
var create_sampler_1 = require("./create-sampler");
Object.defineProperty(exports, "createSampler", { enumerable: true, get: function () { return create_sampler_1.createSampler; } });
var sample_1 = require("./sample");
Object.defineProperty(exports, "sample", { enumerable: true, get: function () { return sample_1.sample; } });
var info_1 = require("./info");
Object.defineProperty(exports, "getVideoInfo", { enumerable: true, get: function () { return info_1.getVideoInfo; } });
var strategies_1 = require("./strategies");
Object.defineProperty(exports, "intervalTimestamps", { enumerable: true, get: function () { return strategies_1.intervalTimestamps; } });
Object.defineProperty(exports, "uniformTimestamps", { enumerable: true, get: function () { return strategies_1.uniformTimestamps; } });
Object.defineProperty(exports, "keyframeTimestamps", { enumerable: true, get: function () { return strategies_1.keyframeTimestamps; } });
Object.defineProperty(exports, "customTimestamps", { enumerable: true, get: function () { return strategies_1.customTimestamps; } });
//# sourceMappingURL=index.js.map