import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoNotFoundError, FfmpegNotFoundError } from '../../errors';

// Mock fluent-ffmpeg before importing the module under test
vi.mock('fluent-ffmpeg', () => {
  const ffprobeMock = vi.fn();
  const mod = ffprobeMock as unknown as { ffprobe: typeof ffprobeMock };
  mod.ffprobe = ffprobeMock;
  return { default: mod };
});

// Must import AFTER the mock is registered
import ffmpeg from 'fluent-ffmpeg';
import { probeVideo } from '../../video/ffprobe';

const mockFfprobe = ffmpeg.ffprobe as ReturnType<typeof vi.fn>;

const MOCK_METADATA = {
  streams: [
    {
      codec_type: 'video',
      codec_name: 'h264',
      width: 1920,
      height: 1080,
      r_frame_rate: '30/1',
      nb_frames: '1800',
      duration: '60',
    },
    {
      codec_type: 'audio',
      codec_name: 'aac',
    },
  ],
  format: {
    duration: '60',
    bit_rate: '5000000',
    size: '100000000',
    format_name: 'mp4,mov',
  },
};

describe('probeVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a VideoInfo object with correct fields', async () => {
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: typeof MOCK_METADATA) => void) => {
      cb(null, MOCK_METADATA);
    });

    const info = await probeVideo('/test.mp4');

    expect(info.path).toBe('/test.mp4');
    expect(info.width).toBe(1920);
    expect(info.height).toBe(1080);
    expect(info.duration).toBe(60);
    expect(info.fps).toBe(30);
    expect(info.codec).toBe('h264');
    expect(info.bitrate).toBe(5000000);
    expect(info.fileSize).toBe(100000000);
    expect(info.format).toBe('mp4');
    expect(info.hasAudio).toBe(true);
    expect(info.totalFrames).toBe(1800);
  });

  it('parses fractional fps correctly (e.g. 24000/1001 ≈ 23.976)', async () => {
    const metadata = {
      ...MOCK_METADATA,
      streams: [
        { ...MOCK_METADATA.streams[0], r_frame_rate: '24000/1001', nb_frames: undefined },
      ],
      format: { ...MOCK_METADATA.format },
    };
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: typeof metadata) => void) => {
      cb(null, metadata);
    });

    const info = await probeVideo('/test.mp4');
    expect(info.fps).toBeCloseTo(23.976, 2);
  });

  it('sets hasAudio to false when no audio stream', async () => {
    const metadata = {
      streams: [MOCK_METADATA.streams[0]],
      format: MOCK_METADATA.format,
    };
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: typeof metadata) => void) => {
      cb(null, metadata);
    });

    const info = await probeVideo('/test.mp4');
    expect(info.hasAudio).toBe(false);
  });

  it('throws VideoNotFoundError when error contains "No such file"', async () => {
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: null) => void) => {
      cb(new Error('No such file or directory'), null);
    });

    await expect(probeVideo('/missing.mp4')).rejects.toBeInstanceOf(VideoNotFoundError);
  });

  it('throws VideoNotFoundError when error contains "does not exist"', async () => {
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: null) => void) => {
      cb(new Error('File does not exist'), null);
    });

    await expect(probeVideo('/missing.mp4')).rejects.toBeInstanceOf(VideoNotFoundError);
  });

  it('throws FfmpegNotFoundError when ffprobe is not found', async () => {
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: null) => void) => {
      cb(new Error('ffprobe not found in PATH'), null);
    });

    await expect(probeVideo('/test.mp4')).rejects.toBeInstanceOf(FfmpegNotFoundError);
  });

  it('rethrows other errors as-is', async () => {
    const originalError = new Error('unexpected codec error');
    mockFfprobe.mockImplementation((_path: string, cb: (err: Error | null, data: null) => void) => {
      cb(originalError, null);
    });

    await expect(probeVideo('/test.mp4')).rejects.toBe(originalError);
  });
});
