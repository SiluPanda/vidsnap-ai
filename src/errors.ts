export class VideoNotFoundError extends Error {
  readonly name = 'VideoNotFoundError';
  constructor(readonly filePath: string) {
    super(`Video file not found: ${filePath}`);
    Object.setPrototypeOf(this, VideoNotFoundError.prototype);
  }
}

export class InvalidVideoError extends Error {
  readonly name = 'InvalidVideoError';
  constructor(
    readonly filePath: string,
    readonly reason?: string,
  ) {
    super(`Invalid or corrupted video file: ${filePath}${reason ? ` (${reason})` : ''}`);
    Object.setPrototypeOf(this, InvalidVideoError.prototype);
  }
}

export class FfmpegNotFoundError extends Error {
  readonly name = 'FfmpegNotFoundError';
  constructor() {
    super(
      'ffmpeg/ffprobe not found. Install ffmpeg:\n' +
      '  macOS:   brew install ffmpeg\n' +
      '  Ubuntu:  sudo apt-get install ffmpeg\n' +
      '  Windows: choco install ffmpeg  OR  winget install ffmpeg'
    );
    Object.setPrototypeOf(this, FfmpegNotFoundError.prototype);
  }
}
