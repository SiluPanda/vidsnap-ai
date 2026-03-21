import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';
import type { VideoInfo } from '../types';
import { VideoNotFoundError, FfmpegNotFoundError } from '../errors';

function evalFps(rFrameRate: string): number {
  if (!rFrameRate || !rFrameRate.includes('/')) {
    return parseFloat(rFrameRate) || 0;
  }
  const [num, den] = rFrameRate.split('/').map(Number);
  if (!den || den === 0) return num || 0;
  return num / den;
}

export async function probeVideo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        const msg: string = err.message ?? String(err);
        if (msg.includes('No such file') || msg.includes('does not exist')) {
          reject(new VideoNotFoundError(filePath));
        } else if (msg.toLowerCase().includes('ffprobe') && msg.toLowerCase().includes('not found')) {
          reject(new FfmpegNotFoundError());
        } else {
          reject(err);
        }
        return;
      }

      const streams = metadata.streams ?? [];
      const videoStream = streams.find((s) => s.codec_type === 'video');
      const audioStream = streams.find((s) => s.codec_type === 'audio');
      const fmt = metadata.format ?? {};

      const width = videoStream?.width ?? 0;
      const height = videoStream?.height ?? 0;
      const duration = parseFloat(String(fmt.duration ?? videoStream?.duration ?? '0'));
      const fps = videoStream?.r_frame_rate ? evalFps(videoStream.r_frame_rate) : 0;
      const codec = videoStream?.codec_name ?? '';
      const bitrate = parseInt(String(fmt.bit_rate ?? '0'), 10);
      const fileSize = parseInt(String(fmt.size ?? '0'), 10);
      const format = (fmt.format_name ?? '').split(',')[0];
      const hasAudio = audioStream !== undefined;

      // rotation from tags
      const tags = (videoStream as Record<string, unknown> | undefined)?.['tags'] as Record<string, string> | undefined;
      const rotationStr = tags?.['rotate'] ?? '0';
      const rotation = parseInt(rotationStr, 10) || 0;
      void rotation; // available but not part of VideoInfo interface

      const totalFrames = videoStream?.nb_frames
        ? parseInt(String(videoStream.nb_frames), 10)
        : Math.round(duration * fps);

      resolve({
        path: filePath,
        duration,
        width,
        height,
        fps,
        codec,
        totalFrames,
        fileSize,
        bitrate,
        hasAudio,
        format,
      });
    });
  });
}

export async function checkFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}
