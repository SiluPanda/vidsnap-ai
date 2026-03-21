export declare class VideoNotFoundError extends Error {
    readonly filePath: string;
    readonly name = "VideoNotFoundError";
    constructor(filePath: string);
}
export declare class InvalidVideoError extends Error {
    readonly filePath: string;
    readonly reason?: string | undefined;
    readonly name = "InvalidVideoError";
    constructor(filePath: string, reason?: string | undefined);
}
export declare class FfmpegNotFoundError extends Error {
    readonly name = "FfmpegNotFoundError";
    constructor();
}
//# sourceMappingURL=errors.d.ts.map