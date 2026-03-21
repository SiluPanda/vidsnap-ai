"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const interval_1 = require("../../strategies/interval");
(0, vitest_1.describe)('intervalTimestamps', () => {
    (0, vitest_1.it)('generates correct timestamps for 60s at 10s interval', () => {
        const result = (0, interval_1.intervalTimestamps)(60, 10);
        (0, vitest_1.expect)(result).toEqual([0, 10, 20, 30, 40, 50, 60]);
    });
    (0, vitest_1.it)('always includes 0 as first timestamp', () => {
        const result = (0, interval_1.intervalTimestamps)(30, 5);
        (0, vitest_1.expect)(result[0]).toBe(0);
    });
    (0, vitest_1.it)('always includes the final frame (duration) as last timestamp', () => {
        const result = (0, interval_1.intervalTimestamps)(60, 10);
        (0, vitest_1.expect)(result[result.length - 1]).toBe(60);
    });
    (0, vitest_1.it)('caps output at maxFrames', () => {
        const result = (0, interval_1.intervalTimestamps)(60, 10, 4);
        (0, vitest_1.expect)(result.length).toBeLessThanOrEqual(4);
    });
    (0, vitest_1.it)('handles duration not evenly divisible by interval', () => {
        const result = (0, interval_1.intervalTimestamps)(65, 10);
        (0, vitest_1.expect)(result[0]).toBe(0);
        (0, vitest_1.expect)(result[result.length - 1]).toBe(65);
        (0, vitest_1.expect)(result).toContain(60);
        (0, vitest_1.expect)(result).toContain(65);
    });
    (0, vitest_1.it)('returns [0] for zero/negative duration', () => {
        (0, vitest_1.expect)((0, interval_1.intervalTimestamps)(0, 10)).toEqual([0]);
        (0, vitest_1.expect)((0, interval_1.intervalTimestamps)(-5, 10)).toEqual([0]);
    });
    (0, vitest_1.it)('handles single-frame case (intervalSecs >= duration)', () => {
        const result = (0, interval_1.intervalTimestamps)(5, 10);
        (0, vitest_1.expect)(result).toContain(0);
        (0, vitest_1.expect)(result).toContain(5);
    });
});
//# sourceMappingURL=interval.test.js.map