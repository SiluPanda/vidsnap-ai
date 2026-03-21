import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';

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

function extractSingleFrame(
  filePath: string,
  timestamp: number,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(['-q:v', '2'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

export async function extractFrames(
  filePath: string,
  options: ExtractOptions,
): Promise<RawFrame[]> {
  const { timestamps, width = 0, height = 0, format = 'jpg' } = options;

  const tmpDir = join(tmpdir(), `vidsnap-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const results: RawFrame[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const outputPath = join(tmpDir, `frame_${i}.${format}`);
      await extractSingleFrame(filePath, ts, outputPath);
      const data = readFileSync(outputPath);
      results.push({ timestamp: ts, data, width, height });
    }

    // sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);

    return results;
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // silently ignore cleanup errors
    }
  }
}
