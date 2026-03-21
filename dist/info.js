"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoInfo = getVideoInfo;
const ffprobe_1 = require("./video/ffprobe");
const tmp_utils_1 = require("./video/tmp-utils");
async function getVideoInfo(video) {
    if (Buffer.isBuffer(video)) {
        const tmpPath = (0, tmp_utils_1.writeTmpFile)(video, 'mp4');
        try {
            return await (0, ffprobe_1.probeVideo)(tmpPath);
        }
        finally {
            (0, tmp_utils_1.cleanTmpFile)(tmpPath);
        }
    }
    return (0, ffprobe_1.probeVideo)(video);
}
//# sourceMappingURL=info.js.map