import { probeVideo } from './video/ffprobe';
import type { VideoSource, VideoInfo } from './types';
import { writeTmpFile, cleanTmpFile } from './video/tmp-utils';

export async function getVideoInfo(video: VideoSource): Promise<VideoInfo> {
  if (Buffer.isBuffer(video)) {
    const tmpPath = writeTmpFile(video, 'mp4');
    try {
      return await probeVideo(tmpPath);
    } finally {
      cleanTmpFile(tmpPath);
    }
  }
  return probeVideo(video);
}
