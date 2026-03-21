import { describe, it, expect } from 'vitest';
import { VideoNotFoundError, InvalidVideoError, FfmpegNotFoundError } from '../errors';

// ── VideoNotFoundError ────────────────────────────────────────────────────────

describe('VideoNotFoundError', () => {
  it('has name "VideoNotFoundError"', () => {
    const err = new VideoNotFoundError('/tmp/missing.mp4');
    expect(err.name).toBe('VideoNotFoundError');
  });

  it('message contains the file path', () => {
    const path = '/some/path/video.mp4';
    const err = new VideoNotFoundError(path);
    expect(err.message).toContain(path);
  });

  it('exposes filePath property', () => {
    const path = '/videos/clip.mov';
    const err = new VideoNotFoundError(path);
    expect(err.filePath).toBe(path);
  });

  it('is an instance of Error', () => {
    const err = new VideoNotFoundError('/tmp/x.mp4');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of VideoNotFoundError', () => {
    const err = new VideoNotFoundError('/tmp/x.mp4');
    expect(err).toBeInstanceOf(VideoNotFoundError);
  });

  it('has correct prototype chain', () => {
    const err = new VideoNotFoundError('/tmp/x.mp4');
    expect(Object.getPrototypeOf(err)).toBe(VideoNotFoundError.prototype);
  });
});

// ── InvalidVideoError ─────────────────────────────────────────────────────────

describe('InvalidVideoError', () => {
  it('has name "InvalidVideoError"', () => {
    const err = new InvalidVideoError('/tmp/bad.mp4');
    expect(err.name).toBe('InvalidVideoError');
  });

  it('message contains the file path', () => {
    const path = '/corrupt/video.mp4';
    const err = new InvalidVideoError(path);
    expect(err.message).toContain(path);
  });

  it('includes reason in message when provided', () => {
    const err = new InvalidVideoError('/tmp/x.mp4', 'missing moov atom');
    expect(err.message).toContain('missing moov atom');
  });

  it('does not include reason text when reason is absent', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    // message should not have a parenthetical reason segment
    expect(err.message).not.toContain('(');
    expect(err.message).not.toContain(')');
  });

  it('exposes filePath property', () => {
    const path = '/videos/corrupted.avi';
    const err = new InvalidVideoError(path);
    expect(err.filePath).toBe(path);
  });

  it('exposes reason property when provided', () => {
    const err = new InvalidVideoError('/tmp/x.mp4', 'unsupported codec');
    expect(err.reason).toBe('unsupported codec');
  });

  it('reason property is undefined when not provided', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    expect(err.reason).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of InvalidVideoError', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    expect(err).toBeInstanceOf(InvalidVideoError);
  });

  it('has correct prototype chain', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    expect(Object.getPrototypeOf(err)).toBe(InvalidVideoError.prototype);
  });
});

// ── FfmpegNotFoundError ───────────────────────────────────────────────────────

describe('FfmpegNotFoundError', () => {
  it('has name "FfmpegNotFoundError"', () => {
    const err = new FfmpegNotFoundError();
    expect(err.name).toBe('FfmpegNotFoundError');
  });

  it('message contains "ffmpeg"', () => {
    const err = new FfmpegNotFoundError();
    expect(err.message.toLowerCase()).toContain('ffmpeg');
  });

  it('message contains macOS install hint (brew)', () => {
    const err = new FfmpegNotFoundError();
    expect(err.message).toContain('brew');
  });

  it('message contains Ubuntu install hint (apt-get)', () => {
    const err = new FfmpegNotFoundError();
    expect(err.message).toContain('apt-get');
  });

  it('message contains Windows install hint (choco)', () => {
    const err = new FfmpegNotFoundError();
    expect(err.message).toContain('choco');
  });

  it('constructor takes no arguments', () => {
    // This is a compile-time and runtime check: no args required
    expect(() => new FfmpegNotFoundError()).not.toThrow();
  });

  it('is an instance of Error', () => {
    const err = new FfmpegNotFoundError();
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of FfmpegNotFoundError', () => {
    const err = new FfmpegNotFoundError();
    expect(err).toBeInstanceOf(FfmpegNotFoundError);
  });

  it('has correct prototype chain', () => {
    const err = new FfmpegNotFoundError();
    expect(Object.getPrototypeOf(err)).toBe(FfmpegNotFoundError.prototype);
  });
});

// ── All three error classes: cross-checks ────────────────────────────────────

describe('All error classes', () => {
  it('VideoNotFoundError is not instanceof InvalidVideoError', () => {
    const err = new VideoNotFoundError('/tmp/x.mp4');
    expect(err).not.toBeInstanceOf(InvalidVideoError);
    expect(err).not.toBeInstanceOf(FfmpegNotFoundError);
  });

  it('InvalidVideoError is not instanceof VideoNotFoundError', () => {
    const err = new InvalidVideoError('/tmp/x.mp4');
    expect(err).not.toBeInstanceOf(VideoNotFoundError);
    expect(err).not.toBeInstanceOf(FfmpegNotFoundError);
  });

  it('FfmpegNotFoundError is not instanceof VideoNotFoundError or InvalidVideoError', () => {
    const err = new FfmpegNotFoundError();
    expect(err).not.toBeInstanceOf(VideoNotFoundError);
    expect(err).not.toBeInstanceOf(InvalidVideoError);
  });

  it('all three can be caught as Error', () => {
    const errors: Error[] = [
      new VideoNotFoundError('/a'),
      new InvalidVideoError('/b'),
      new FfmpegNotFoundError(),
    ];
    errors.forEach(err => {
      expect(err).toBeInstanceOf(Error);
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    });
  });
});
