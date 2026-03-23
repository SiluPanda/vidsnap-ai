import type { VideoSource, SampleOptions, SampleResult, SampledFrame, SamplingStrategy } from './types';
import { getVideoInfo } from './info';
import { getTimestamps } from './strategies';
import { extractFrames } from './video/frame-extractor';
import { writeTmpFile, cleanTmpFile } from './video/tmp-utils';

const DEFAULTS: Required<Pick<SampleOptions, 'strategy' | 'count' | 'outputFormat' | 'outputBase64' | 'maxFrames' | 'minFrames'>> = {
  strategy: 'hybrid',
  count: 8,
  outputFormat: 'jpeg',
  outputBase64: false,
  maxFrames: 50,
  minFrames: 1,
};

export async function sample(
  video: VideoSource,
  options?: Partial<SampleOptions>,
): Promise<SampleResult> {
  const startMs = Date.now();

  const resolvedOptions: Partial<SampleOptions> = { ...DEFAULTS, ...options };
  const strategy: SamplingStrategy = resolvedOptions.strategy ?? 'hybrid';
  const outputBase64 = resolvedOptions.outputBase64 ?? false;
  const outputFormat = resolvedOptions.outputFormat ?? 'jpeg';

  // Resolve file path — write to tmp if Buffer
  let filePath: string;
  let tmpCreated = false;

  if (Buffer.isBuffer(video)) {
    filePath = writeTmpFile(video, 'mp4');
    tmpCreated = true;
  } else {
    filePath = video;
  }

  try {
    const videoInfo = await getVideoInfo(filePath);

    const timestamps = await getTimestamps(strategy, videoInfo, resolvedOptions);

    const format = outputFormat === 'jpeg' ? 'jpg' : 'png';
    const rawFrames = await extractFrames(filePath, {
      timestamps,
      width: videoInfo.width,
      height: videoInfo.height,
      format,
    });

    const frames: SampledFrame[] = rawFrames.map((raw, idx) => {
      const frame: SampledFrame = {
        buffer: raw.data,
        timestamp: raw.timestamp,
        index: idx,
        mimeType: outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        width: raw.width || videoInfo.width,
        height: raw.height || videoInfo.height,
        byteLength: raw.data.length,
        isSceneChange: false,
      };
      if (outputBase64) {
        frame.base64 = raw.data.toString('base64');
      }
      return frame;
    });

    const processingTimeMs = Date.now() - startMs;

    return {
      frames,
      video: videoInfo,
      meta: {
        strategy,
        candidatesEvaluated: timestamps.length,
        framesDeduped: 0,
        sceneChangesDetected: 0,
        processingTimeMs,
      },
    };
  } finally {
    if (tmpCreated) {
      cleanTmpFile(filePath);
    }
  }
}
