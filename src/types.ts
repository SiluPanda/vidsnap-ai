// ── Source ────────────────────────────────────────────────────────────────────

/** Video input: file path or Buffer. */
export type VideoSource = string | Buffer;

// ── Sampling Strategy ─────────────────────────────────────────────────────────

/** Available sampling strategies. */
export type SamplingStrategy =
  | 'interval'
  | 'scene'
  | 'keyframe'
  | 'hybrid'
  | 'uniform'
  | 'budget'
  | 'custom';

/** Scene change detection algorithms. */
export type SceneAlgorithm = 'histogram' | 'pixel' | 'phash' | 'ssim';

/** Custom frame selector function. */
export type FrameSelector = (info: VideoInfo) => number[] | Promise<number[]>;

// ── Options ───────────────────────────────────────────────────────────────────

export interface SampleOptions {
  /** Sampling strategy. Default: 'hybrid'. */
  strategy?: SamplingStrategy;

  /** Maximum number of frames to return. Default: 50. */
  maxFrames?: number;

  /** Minimum number of frames to return. Default: 1. */
  minFrames?: number;

  // ── Interval strategy options ──

  /** Seconds between frames for 'interval' and 'hybrid' strategies. */
  intervalSeconds?: number;

  // ── Scene change options ──

  /** Scene change detection threshold (0.0-1.0). Default: 0.3. */
  threshold?: number;

  /** Scene change detection algorithm. Default: 'histogram'. */
  algorithm?: SceneAlgorithm;

  /** Multiple algorithms for consensus-based detection. */
  algorithms?: SceneAlgorithm[];

  /** Minimum number of algorithms that must agree. Default: 2. */
  consensus?: number;

  /** Seconds between frames analyzed for scene changes. Default: 0.25. */
  analyzeInterval?: number;

  // ── Hybrid strategy options ──

  /** Minimum seconds between any two frames in hybrid mode. Default: 0.5. */
  minGap?: number;

  // ── Uniform strategy options ──

  /** Exact number of frames for 'uniform' strategy. Default: 10. */
  count?: number;

  // ── Budget strategy options ──

  /** Maximum total vision tokens for 'budget' strategy. */
  tokenBudget?: number;

  /** Target provider for token estimation. Default: 'openai'. */
  provider?: 'openai' | 'anthropic' | 'gemini';

  /** OpenAI detail mode for token estimation. Default: 'high'. */
  detail?: 'low' | 'high';

  // ── Custom strategy options ──

  /** Custom frame selector function for 'custom' strategy. */
  selector?: FrameSelector;

  // ── Deduplication options ──

  /** Enable frame deduplication. Default: true. */
  dedup?: boolean;

  /** Dedup similarity threshold (0.0-1.0). Default: 0.9. */
  dedupThreshold?: number;

  // ── Output options ──

  /** Output image format for extracted frames. Default: 'jpeg'. */
  outputFormat?: 'jpeg' | 'png';

  /** JPEG quality (1-100). Default: 85. */
  quality?: number;

  /** Include base64-encoded image in each frame. Default: false. */
  outputBase64?: boolean;

  /** Resize frames to specific dimensions. */
  maxWidth?: number;
  maxHeight?: number;

  /** Prepare frames for a specific provider using vision-prep. */
  prepareForProvider?: 'openai' | 'anthropic' | 'gemini';

  /** Model identifier for cost estimation (e.g., 'gpt-4o'). */
  model?: string;

  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface SceneDetectOptions {
  /** Detection algorithm. Default: 'histogram'. */
  algorithm?: SceneAlgorithm;

  /** Multiple algorithms for consensus. */
  algorithms?: SceneAlgorithm[];

  /** Consensus threshold. Default: 2. */
  consensus?: number;

  /** Detection threshold (0.0-1.0). Default: 0.3. */
  threshold?: number;

  /** Seconds between analyzed frames. Default: 0.25. */
  analyzeInterval?: number;

  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface SamplerConfig extends SampleOptions {
  // All SampleOptions fields serve as defaults for every sample() call.
  // Per-call options override these defaults.
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface SampleResult {
  /** Extracted frames in timestamp order. */
  frames: SampledFrame[];

  /** Video metadata. */
  video: VideoInfo;

  /** Sampling metadata. */
  meta: SampleMeta;
}

export interface SampleMeta {
  /** Strategy used. */
  strategy: SamplingStrategy;

  /** Total number of candidate frames evaluated. */
  candidatesEvaluated: number;

  /** Number of frames removed by deduplication. */
  framesDeduped: number;

  /** Number of scene changes detected (for scene/hybrid strategies). */
  sceneChangesDetected: number;

  /** Total processing time in milliseconds. */
  processingTimeMs: number;

  /** Token budget information (for budget strategy). */
  tokenBudget?: number;
  estimatedTokensUsed?: number;
  tokensPerFrame?: number;
}

export interface SampledFrame {
  /** Frame image data as a Buffer. */
  buffer: Buffer;

  /** Base64-encoded frame image. Only populated when outputBase64 is true. */
  base64?: string;

  /** Timestamp of this frame in seconds from the start of the video. */
  timestamp: number;

  /** Zero-based sequential index of this frame in the output array. */
  index: number;

  /** MIME type of the frame image. */
  mimeType: 'image/jpeg' | 'image/png';

  /** Frame width in pixels. */
  width: number;

  /** Frame height in pixels. */
  height: number;

  /** Size of the frame image in bytes. */
  byteLength: number;

  /** Scene change score at this frame (0.0-1.0). */
  sceneChangeScore?: number;

  /** Perceptual hash similarity to the previous selected frame (0.0-1.0). */
  similarity?: number;

  /** Whether this frame was selected as a scene change boundary. */
  isSceneChange: boolean;

  /** Estimated vision token count for this frame. Requires vision-prep. */
  tokens?: number;

  /** Estimated cost in USD for this frame. Requires vision-prep. */
  cost?: number;

  /** Provider-formatted content block for this frame. Requires vision-prep. */
  contentBlock?: Record<string, unknown>;
}

export interface SceneChange {
  /** Timestamp of the scene change in seconds. */
  timestamp: number;

  /** Scene change magnitude (0.0-1.0). */
  score: number;

  /** Which algorithm detected this scene change. */
  algorithm: SceneAlgorithm;

  /** Frame index in the analysis sequence. */
  frameIndex: number;
}

export interface VideoInfo {
  /** Absolute path to the video file. */
  path: string;

  /** Video duration in seconds. */
  duration: number;

  /** Video width in pixels. */
  width: number;

  /** Video height in pixels. */
  height: number;

  /** Frame rate in frames per second. */
  fps: number;

  /** Video codec name. */
  codec: string;

  /** Total number of frames. */
  totalFrames: number;

  /** File size in bytes. */
  fileSize: number;

  /** Bitrate in bits per second. */
  bitrate: number;

  /** Whether the video has an audio stream. */
  hasAudio: boolean;

  /** Container format. */
  format: string;
}

// ── VideoSampler interface ────────────────────────────────────────────────────

export interface VideoSampler {
  sample(video: VideoSource, options?: Partial<SampleOptions>): Promise<SampleResult>;
  sampleStream(video: VideoSource, options?: Partial<SampleOptions>): AsyncIterable<SampledFrame>;
  detectScenes(video: VideoSource, options?: Partial<SceneDetectOptions>): Promise<SceneChange[]>;
  getVideoInfo(video: VideoSource): Promise<VideoInfo>;
}
