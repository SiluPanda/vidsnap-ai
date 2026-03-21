"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSampler = createSampler;
const sample_1 = require("./sample");
const info_1 = require("./info");
function createSampler(config) {
    return {
        async sample(video, options) {
            return (0, sample_1.sample)(video, { ...config, ...options });
        },
        async getVideoInfo(video) {
            return (0, info_1.getVideoInfo)(video);
        },
        async detectScenes(_video, _options) {
            // Stub: scene detection requires sharp — implement in a later phase
            return [];
        },
        async *sampleStream(video, options) {
            const result = await (0, sample_1.sample)(video, { ...config, ...options });
            for (const frame of result.frames) {
                yield frame;
            }
        },
    };
}
//# sourceMappingURL=create-sampler.js.map