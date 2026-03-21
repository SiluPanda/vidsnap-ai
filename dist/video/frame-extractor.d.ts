export interface ExtractOptions {
    timestamps: number[];
    width?: number;
    height?: number;
    format?: 'jpg' | 'png';
}
export interface RawFrame {
    timestamp: number;
    data: Buffer;
    width: number;
    height: number;
}
export declare function extractFrames(filePath: string, options: ExtractOptions): Promise<RawFrame[]>;
//# sourceMappingURL=frame-extractor.d.ts.map