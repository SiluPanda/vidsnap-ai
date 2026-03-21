"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTmpFile = writeTmpFile;
exports.cleanTmpFile = cleanTmpFile;
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
function writeTmpFile(buffer, ext = 'mp4') {
    const filePath = (0, path_1.join)((0, os_1.tmpdir)(), `vidsnap-${(0, crypto_1.randomUUID)()}.${ext}`);
    (0, fs_1.writeFileSync)(filePath, buffer);
    return filePath;
}
function cleanTmpFile(path) {
    try {
        (0, fs_1.unlinkSync)(path);
    }
    catch {
        // silently ignore cleanup errors
    }
}
//# sourceMappingURL=tmp-utils.js.map