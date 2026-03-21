"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const uniform_1 = require("../../strategies/uniform");
(0, vitest_1.describe)('uniformTimestamps', () => {
    (0, vitest_1.it)('returns evenly spaced frames: duration=60, count=3 → [0, 30, 60]', () => {
        (0, vitest_1.expect)((0, uniform_1.uniformTimestamps)(60, 3)).toEqual([0, 30, 60]);
    });
    (0, vitest_1.it)('returns [duration/2] when count=1', () => {
        (0, vitest_1.expect)((0, uniform_1.uniformTimestamps)(60, 1)).toEqual([30]);
    });
    (0, vitest_1.it)('returns [] when count=0', () => {
        (0, vitest_1.expect)((0, uniform_1.uniformTimestamps)(60, 0)).toEqual([]);
    });
    (0, vitest_1.it)('first timestamp is always 0 for count >= 2', () => {
        (0, vitest_1.expect)((0, uniform_1.uniformTimestamps)(120, 5)[0]).toBe(0);
    });
    (0, vitest_1.it)('last timestamp equals duration for count >= 2', () => {
        const result = (0, uniform_1.uniformTimestamps)(120, 5);
        (0, vitest_1.expect)(result[result.length - 1]).toBe(120);
    });
    (0, vitest_1.it)('returns count timestamps', () => {
        (0, vitest_1.expect)((0, uniform_1.uniformTimestamps)(60, 8)).toHaveLength(8);
    });
    (0, vitest_1.it)('timestamps are evenly spaced', () => {
        const result = (0, uniform_1.uniformTimestamps)(40, 5);
        // [0, 10, 20, 30, 40]
        (0, vitest_1.expect)(result).toEqual([0, 10, 20, 30, 40]);
    });
});
//# sourceMappingURL=uniform.test.js.map