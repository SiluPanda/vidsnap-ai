# vidsnap-ai

Smart video frame sampler for vision AI analysis.

[![npm version](https://img.shields.io/npm/v/vidsnap-ai.svg)](https://www.npmjs.com/package/vidsnap-ai)
[![license](https://img.shields.io/npm/l/vidsnap-ai.svg)](https://github.com/SiluPanda/vidsnap-ai/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/vidsnap-ai.svg)](https://nodejs.org/)
[![types](https://img.shields.io/npm/types/vidsnap-ai.svg)](https://www.npmjs.com/package/vidsnap-ai)

---

## Description

`vidsnap-ai` extracts the most informative frames from any video for multimodal LLM analysis. Given a video file (path or Buffer) and a sampling strategy, it selects representative frames, deduplicates near-identical content, and returns structured `SampledFrame` objects ready for vision APIs such as OpenAI GPT-4o, Anthropic Claude, and Google Gemini.

A naive approach to video analysis -- extracting every frame -- is catastrophically wasteful. A 60-second video at 30 fps produces 1,800 frames, each costing 85 to 2,091 vision tokens depending on the provider. Smart sampling selects the 10--30 frames that capture distinct visual content, reducing token cost by 60--180x while preserving the information the LLM needs.

The package provides seven sampling strategies (uniform, interval, keyframe, scene, hybrid, budget, and custom), a factory function for reusable configuration, streaming frame extraction for long videos, and video metadata probing -- all in a single dependency.

---

## Installation

```bash
npm install vidsnap-ai
```

### Prerequisites

**ffmpeg** and **ffprobe** must be installed on your system and available in `$PATH`.

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
# or
winget install ffmpeg
```

### Optional Peer Dependency

`sharp` (>=0.33.0) is an optional peer dependency required for scene change detection algorithms and frame deduplication. It is not needed for the `uniform`, `interval`, `keyframe`, or `custom` strategies.

```bash
npm install sharp
```

---

## Quick Start

```ts
import { sample } from 'vidsnap-ai';

const result = await sample('./lecture.mp4', {
  strategy: 'uniform',
  count: 10,
  outputFormat: 'jpeg',
});

console.log(`Extracted ${result.frames.length} frames`);
console.log(`Video duration: ${result.video.duration}s`);
console.log(`Processing time: ${result.meta.processingTimeMs}ms`);

for (const frame of result.frames) {
  console.log(`  Frame ${frame.index}: ${frame.timestamp}s (${frame.width}x${frame.height})`);
}
```

### Using the Factory

```ts
import { createSampler } from 'vidsnap-ai';

const sampler = createSampler({
  strategy: 'interval',
  intervalSeconds: 5,
  maxFrames: 20,
  outputFormat: 'jpeg',
  quality: 85,
});

// Reuse the sampler across multiple videos
const result1 = await sampler.sample('./video-a.mp4');
const result2 = await sampler.sample('./video-b.mp4');
```

### Streaming Frames

```ts
const sampler = createSampler({ strategy: 'uniform', count: 8 });

for await (const frame of sampler.sampleStream('./long-video.mp4')) {
  console.log(`Frame ${frame.index} at ${frame.timestamp}s`);
  // process each frame as it arrives
}
```

---

## Features

- **Seven sampling strategies** -- uniform, interval, keyframe, scene change, hybrid, token budget, and custom selector.
- **Video metadata probing** -- extract duration, resolution, fps, codec, bitrate, file size, and audio presence without decoding frames.
- **Buffer input support** -- pass a video file path or an in-memory `Buffer` directly.
- **Base64 output** -- optionally include base64-encoded image data on each frame for direct embedding in API payloads.
- **Streaming extraction** -- `sampleStream()` yields frames via `AsyncIterable` for memory-efficient processing of long videos.
- **Factory pattern** -- `createSampler()` pre-configures defaults that apply to every subsequent `sample()` call, with per-call overrides.
- **Scene change detection** -- `detectScenes()` returns scene boundary timestamps, scores, and algorithm metadata.
- **Frame deduplication** -- remove near-identical frames using perceptual hashing (requires `sharp`).
- **Provider-aware formatting** -- optional integration with `vision-prep` for provider-specific image optimization and token cost estimation.
- **Typed error hierarchy** -- distinct error classes for missing files, invalid videos, and missing ffmpeg.
- **Full TypeScript support** -- ships with declaration files and source maps.
- **Cancellation** -- pass an `AbortSignal` to cancel long-running operations.

---

## API Reference

### `sample(video, options?)`

Extract frames from a video using a sampling strategy.

```ts
function sample(video: VideoSource, options?: Partial<SampleOptions>): Promise<SampleResult>;
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `video` | `VideoSource` | File path (`string`) or video data (`Buffer`). |
| `options` | `Partial<SampleOptions>` | Sampling configuration. See [SampleOptions](#sampleoptions). |

**Returns:** `Promise<SampleResult>` -- frames, video metadata, and sampling metadata.

```ts
import { sample } from 'vidsnap-ai';

const result = await sample('./video.mp4', {
  strategy: 'interval',
  intervalSeconds: 2,
  maxFrames: 30,
  outputBase64: true,
});

for (const frame of result.frames) {
  // frame.buffer   -- raw image Buffer
  // frame.base64   -- base64-encoded string (when outputBase64 is true)
  // frame.timestamp -- seconds from video start
}
```

---

### `createSampler(config?)`

Create a reusable sampler instance with pre-configured defaults.

```ts
function createSampler(config?: Partial<SamplerConfig>): VideoSampler;
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `Partial<SamplerConfig>` | Default options applied to every call. Per-call options override these. |

**Returns:** `VideoSampler` -- an object with `sample()`, `sampleStream()`, `detectScenes()`, and `getVideoInfo()` methods.

```ts
import { createSampler } from 'vidsnap-ai';

const sampler = createSampler({
  strategy: 'uniform',
  count: 8,
  outputFormat: 'png',
  outputBase64: true,
});

const result = await sampler.sample('./video.mp4');
// Override defaults per call:
const result2 = await sampler.sample('./other.mp4', { count: 4 });
```

---

### `getVideoInfo(video)`

Extract video metadata without decoding any frames.

```ts
function getVideoInfo(video: VideoSource): Promise<VideoInfo>;
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `video` | `VideoSource` | File path (`string`) or video data (`Buffer`). |

**Returns:** `Promise<VideoInfo>`

```ts
import { getVideoInfo } from 'vidsnap-ai';

const info = await getVideoInfo('./video.mp4');
console.log(info.duration);    // 120.5
console.log(info.width);       // 1920
console.log(info.height);      // 1080
console.log(info.fps);         // 29.97
console.log(info.codec);       // 'h264'
console.log(info.totalFrames); // 3612
console.log(info.fileSize);    // 52428800
console.log(info.bitrate);     // 3500000
console.log(info.hasAudio);    // true
console.log(info.format);      // 'mp4'
```

---

### `VideoSampler.sampleStream(video, options?)`

Stream frames as an `AsyncIterable`. Available on instances returned by `createSampler()`.

```ts
sampleStream(video: VideoSource, options?: Partial<SampleOptions>): AsyncIterable<SampledFrame>;
```

```ts
const sampler = createSampler({ strategy: 'uniform', count: 20 });

for await (const frame of sampler.sampleStream('./video.mp4')) {
  // Process frames one at a time
  await uploadFrame(frame.buffer, frame.timestamp);
}
```

---

### `VideoSampler.detectScenes(video, options?)`

Detect scene change boundaries in a video. Available on instances returned by `createSampler()`.

```ts
detectScenes(video: VideoSource, options?: Partial<SceneDetectOptions>): Promise<SceneChange[]>;
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `video` | `VideoSource` | File path or Buffer. |
| `options` | `Partial<SceneDetectOptions>` | Detection configuration. See [SceneDetectOptions](#scenedetectoptions). |

**Returns:** `Promise<SceneChange[]>`

```ts
const sampler = createSampler();

const scenes = await sampler.detectScenes('./movie-clip.mp4', {
  algorithm: 'histogram',
  threshold: 0.3,
  analyzeInterval: 0.25,
});

for (const scene of scenes) {
  console.log(`Scene at ${scene.timestamp}s -- score: ${scene.score}, algo: ${scene.algorithm}`);
}
```

---

### Strategy Helper Functions

Low-level functions that compute timestamp arrays for each strategy. Useful for building custom sampling pipelines.

#### `intervalTimestamps(duration, intervalSecs, maxFrames?)`

Generate timestamps at fixed time intervals.

```ts
function intervalTimestamps(duration: number, intervalSecs: number, maxFrames?: number): number[];
```

```ts
import { intervalTimestamps } from 'vidsnap-ai';

intervalTimestamps(60, 10);     // [0, 10, 20, 30, 40, 50, 60]
intervalTimestamps(60, 10, 4);  // [0, 10, 20, 30]
```

#### `uniformTimestamps(duration, count)`

Generate evenly spaced timestamps across the video duration.

```ts
function uniformTimestamps(duration: number, count: number): number[];
```

```ts
import { uniformTimestamps } from 'vidsnap-ai';

uniformTimestamps(60, 3);  // [0, 30, 60]
uniformTimestamps(60, 1);  // [30]
```

#### `keyframeTimestamps(duration, fps, maxFrames?)`

Estimate keyframe (I-frame) positions using a default GOP interval of 2 seconds.

```ts
function keyframeTimestamps(duration: number, fps: number, maxFrames?: number): number[];
```

```ts
import { keyframeTimestamps } from 'vidsnap-ai';

keyframeTimestamps(10, 30);  // [0, 2, 4, 6, 8, 10]
```

#### `customTimestamps(duration, selector, videoInfo)`

Compute timestamps using a user-provided `FrameSelector` function.

```ts
function customTimestamps(
  duration: number,
  selector: FrameSelector,
  videoInfo: VideoInfo,
): Promise<number[]>;
```

```ts
import { customTimestamps, getVideoInfo } from 'vidsnap-ai';

const info = await getVideoInfo('./video.mp4');
const timestamps = await customTimestamps(
  info.duration,
  (videoInfo) => [0, videoInfo.duration / 2, videoInfo.duration],
  info,
);
// [0, 30, 60] for a 60-second video
```

---

### Types

#### `VideoSource`

```ts
type VideoSource = string | Buffer;
```

Video input as a file path or in-memory Buffer.

#### `SamplingStrategy`

```ts
type SamplingStrategy = 'interval' | 'scene' | 'keyframe' | 'hybrid' | 'uniform' | 'budget' | 'custom';
```

#### `SceneAlgorithm`

```ts
type SceneAlgorithm = 'histogram' | 'pixel' | 'phash' | 'ssim';
```

#### `FrameSelector`

```ts
type FrameSelector = (info: VideoInfo) => number[] | Promise<number[]>;
```

Custom function that receives video metadata and returns an array of timestamps (in seconds) to extract.

#### `SampleOptions`

All fields are optional.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `strategy` | `SamplingStrategy` | `'uniform'` | Sampling strategy to use. |
| `maxFrames` | `number` | `50` | Maximum number of frames to return. |
| `minFrames` | `number` | `1` | Minimum number of frames to return. |
| `intervalSeconds` | `number` | `1.0` | Seconds between frames for `interval` and `hybrid` strategies. |
| `threshold` | `number` | `0.3` | Scene change detection threshold (0.0--1.0). |
| `algorithm` | `SceneAlgorithm` | `'histogram'` | Scene detection algorithm. |
| `algorithms` | `SceneAlgorithm[]` | -- | Multiple algorithms for consensus-based detection. |
| `consensus` | `number` | `2` | Minimum algorithms that must agree on a scene change. |
| `analyzeInterval` | `number` | `0.25` | Seconds between frames analyzed for scene changes. |
| `minGap` | `number` | `0.5` | Minimum seconds between frames in hybrid mode. |
| `count` | `number` | `10` | Exact frame count for `uniform` strategy. |
| `tokenBudget` | `number` | -- | Maximum vision tokens for `budget` strategy. |
| `provider` | `'openai' \| 'anthropic' \| 'gemini'` | `'openai'` | Target provider for token estimation. |
| `detail` | `'low' \| 'high'` | `'high'` | OpenAI detail mode for token estimation. |
| `selector` | `FrameSelector` | -- | Custom frame selector for `custom` strategy. |
| `dedup` | `boolean` | `true` | Enable frame deduplication. |
| `dedupThreshold` | `number` | `0.9` | Dedup similarity threshold (0.0--1.0). |
| `outputFormat` | `'jpeg' \| 'png'` | `'jpeg'` | Output image format. |
| `quality` | `number` | `85` | JPEG quality (1--100). |
| `outputBase64` | `boolean` | `false` | Include base64-encoded image in each frame. |
| `maxWidth` | `number` | -- | Resize frames to this maximum width. |
| `maxHeight` | `number` | -- | Resize frames to this maximum height. |
| `prepareForProvider` | `'openai' \| 'anthropic' \| 'gemini'` | -- | Prepare frames for a specific provider via `vision-prep`. |
| `model` | `string` | -- | Model identifier for cost estimation (e.g., `'gpt-4o'`). |
| `signal` | `AbortSignal` | -- | Signal for cancellation. |

#### `SceneDetectOptions`

All fields are optional.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `algorithm` | `SceneAlgorithm` | `'histogram'` | Detection algorithm. |
| `algorithms` | `SceneAlgorithm[]` | -- | Multiple algorithms for consensus. |
| `consensus` | `number` | `2` | Consensus threshold. |
| `threshold` | `number` | `0.3` | Detection threshold (0.0--1.0). |
| `analyzeInterval` | `number` | `0.25` | Seconds between analyzed frames. |
| `signal` | `AbortSignal` | -- | Signal for cancellation. |

#### `SamplerConfig`

Extends `SampleOptions`. All fields serve as defaults for every `sample()` call on the created sampler. Per-call options override these defaults.

#### `VideoInfo`

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Absolute path to the video file. |
| `duration` | `number` | Duration in seconds. |
| `width` | `number` | Width in pixels. |
| `height` | `number` | Height in pixels. |
| `fps` | `number` | Frame rate (frames per second). |
| `codec` | `string` | Video codec name (e.g., `'h264'`). |
| `totalFrames` | `number` | Total number of frames. |
| `fileSize` | `number` | File size in bytes. |
| `bitrate` | `number` | Bitrate in bits per second. |
| `hasAudio` | `boolean` | Whether the video has an audio stream. |
| `format` | `string` | Container format (e.g., `'mp4'`). |

#### `SampledFrame`

| Field | Type | Description |
|-------|------|-------------|
| `buffer` | `Buffer` | Frame image data. |
| `base64` | `string?` | Base64-encoded image. Present when `outputBase64` is `true`. |
| `timestamp` | `number` | Timestamp in seconds from video start. |
| `index` | `number` | Zero-based sequential index in the output array. |
| `mimeType` | `'image/jpeg' \| 'image/png'` | MIME type of the frame image. |
| `width` | `number` | Frame width in pixels. |
| `height` | `number` | Frame height in pixels. |
| `byteLength` | `number` | Size of the frame image in bytes. |
| `sceneChangeScore` | `number?` | Scene change score (0.0--1.0). |
| `similarity` | `number?` | Perceptual hash similarity to the previous selected frame (0.0--1.0). |
| `isSceneChange` | `boolean` | Whether this frame is a scene change boundary. |
| `tokens` | `number?` | Estimated vision token count. Requires `vision-prep`. |
| `cost` | `number?` | Estimated cost in USD. Requires `vision-prep`. |
| `contentBlock` | `Record<string, unknown>?` | Provider-formatted content block. Requires `vision-prep`. |

#### `SceneChange`

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `number` | Timestamp of the scene change in seconds. |
| `score` | `number` | Scene change magnitude (0.0--1.0). |
| `algorithm` | `SceneAlgorithm` | Which algorithm detected this scene change. |
| `frameIndex` | `number` | Frame index in the analysis sequence. |

#### `SampleResult`

| Field | Type | Description |
|-------|------|-------------|
| `frames` | `SampledFrame[]` | Extracted frames in timestamp order. |
| `video` | `VideoInfo` | Video metadata. |
| `meta` | `SampleMeta` | Sampling metadata. |

#### `SampleMeta`

| Field | Type | Description |
|-------|------|-------------|
| `strategy` | `SamplingStrategy` | Strategy used. |
| `candidatesEvaluated` | `number` | Total candidate frames evaluated. |
| `framesDeduped` | `number` | Frames removed by deduplication. |
| `sceneChangesDetected` | `number` | Scene changes detected. |
| `processingTimeMs` | `number` | Total processing time in milliseconds. |
| `tokenBudget` | `number?` | Token budget (for `budget` strategy). |
| `estimatedTokensUsed` | `number?` | Estimated tokens consumed. |
| `tokensPerFrame` | `number?` | Estimated tokens per frame. |

#### `VideoSampler`

Interface returned by `createSampler()`.

| Method | Signature |
|--------|-----------|
| `sample` | `(video: VideoSource, options?: Partial<SampleOptions>) => Promise<SampleResult>` |
| `sampleStream` | `(video: VideoSource, options?: Partial<SampleOptions>) => AsyncIterable<SampledFrame>` |
| `detectScenes` | `(video: VideoSource, options?: Partial<SceneDetectOptions>) => Promise<SceneChange[]>` |
| `getVideoInfo` | `(video: VideoSource) => Promise<VideoInfo>` |

---

## Configuration

### Sampling Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `uniform` | Evenly spaced frames across the video. | General purpose, predictable output. |
| `interval` | Fixed time interval between frames. | Surveillance, dashcam, time-lapse. |
| `keyframe` | Estimate I-frame positions (every ~2 seconds GOP). | Fast extraction, codec-aware sampling. |
| `scene` | Detect scene changes and sample at boundaries. | Movies, presentations, lectures. |
| `hybrid` | Combine interval + scene detection with deduplication. | Best overall quality for vision AI. |
| `budget` | Maximize visual diversity within a vision token budget. | Cost-constrained LLM pipelines. |
| `custom` | User-provided `FrameSelector` function. | Domain-specific sampling logic. |

### Strategy Examples

**Interval** -- one frame every 5 seconds:

```ts
await sample('./dashcam.mp4', { strategy: 'interval', intervalSeconds: 5 });
```

**Uniform** -- exactly 12 evenly spaced frames:

```ts
await sample('./video.mp4', { strategy: 'uniform', count: 12 });
```

**Keyframe** -- extract at estimated I-frame positions:

```ts
await sample('./video.mp4', { strategy: 'keyframe', maxFrames: 25 });
```

**Custom** -- user-defined frame selection:

```ts
await sample('./video.mp4', {
  strategy: 'custom',
  selector: (info) => [0, info.duration * 0.25, info.duration * 0.5, info.duration * 0.75, info.duration],
});
```

**Budget** -- maximize coverage within a token budget:

```ts
await sample('./video.mp4', {
  strategy: 'budget',
  tokenBudget: 5000,
  provider: 'openai',
  detail: 'high',
});
```

---

## Error Handling

`vidsnap-ai` exports three error classes, all extending `Error`. Each can be caught by class or by `name`.

### `VideoNotFoundError`

Thrown when the specified video file does not exist.

```ts
import { sample, VideoNotFoundError } from 'vidsnap-ai';

try {
  await sample('/nonexistent/video.mp4');
} catch (err) {
  if (err instanceof VideoNotFoundError) {
    console.error(`File not found: ${err.filePath}`);
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `'VideoNotFoundError'` | Error name. |
| `filePath` | `string` | The path that was not found. |
| `message` | `string` | `'Video file not found: <path>'` |

### `InvalidVideoError`

Thrown when the file exists but is corrupted or not a valid video.

```ts
import { sample, InvalidVideoError } from 'vidsnap-ai';

try {
  await sample('./corrupted.mp4');
} catch (err) {
  if (err instanceof InvalidVideoError) {
    console.error(`Invalid video: ${err.filePath} (${err.reason})`);
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `'InvalidVideoError'` | Error name. |
| `filePath` | `string` | Path to the invalid file. |
| `reason` | `string \| undefined` | Optional description of why the file is invalid. |

### `FfmpegNotFoundError`

Thrown when `ffmpeg` or `ffprobe` is not installed or not found in `$PATH`. The error message includes platform-specific installation instructions.

```ts
import { sample, FfmpegNotFoundError } from 'vidsnap-ai';

try {
  await sample('./video.mp4');
} catch (err) {
  if (err instanceof FfmpegNotFoundError) {
    console.error(err.message);
    // Includes: brew install ffmpeg, apt-get install ffmpeg, choco install ffmpeg
  }
}
```

---

## Advanced Usage

### Processing Buffer Input

Pass a video as an in-memory `Buffer` instead of a file path. The buffer is written to a temporary file, processed, and the temporary file is cleaned up automatically.

```ts
import { readFileSync } from 'fs';
import { sample } from 'vidsnap-ai';

const videoBuffer = readFileSync('./video.mp4');
const result = await sample(videoBuffer, { strategy: 'uniform', count: 5 });
```

### Base64 Output for LLM APIs

Enable `outputBase64` to get base64-encoded strings suitable for embedding directly in multimodal API payloads.

```ts
const result = await sample('./video.mp4', {
  strategy: 'uniform',
  count: 8,
  outputBase64: true,
});

// Build an OpenAI-compatible message
const imageContent = result.frames.map((frame) => ({
  type: 'image_url',
  image_url: {
    url: `data:${frame.mimeType};base64,${frame.base64}`,
  },
}));
```

### Frame Count Controls

Use `maxFrames` and `minFrames` to bound the output regardless of strategy.

```ts
const result = await sample('./video.mp4', {
  strategy: 'interval',
  intervalSeconds: 1,
  maxFrames: 20,   // never more than 20 frames
  minFrames: 3,    // at least 3 frames even for very short videos
});
```

### Combining getVideoInfo with Custom Logic

Probe a video first, then decide your sampling strategy based on its properties.

```ts
import { getVideoInfo, sample } from 'vidsnap-ai';

const info = await getVideoInfo('./video.mp4');

const strategy = info.duration > 300 ? 'interval' : 'uniform';
const count = Math.min(Math.ceil(info.duration / 5), 30);

const result = await sample('./video.mp4', { strategy, count, intervalSeconds: 5 });
```

### Reusable Sampler with Per-Call Overrides

The factory pattern is useful when processing many videos with the same base configuration.

```ts
import { createSampler } from 'vidsnap-ai';

const sampler = createSampler({
  strategy: 'uniform',
  count: 8,
  outputFormat: 'jpeg',
  quality: 85,
  outputBase64: true,
});

// Process multiple videos with same defaults
const results = await Promise.all([
  sampler.sample('./video-1.mp4'),
  sampler.sample('./video-2.mp4'),
  sampler.sample('./video-3.mp4', { count: 4 }),  // override count for this one
]);
```

---

## TypeScript

`vidsnap-ai` is written in TypeScript and ships with declaration files (`dist/index.d.ts`) and source maps. All public types are exported from the package root.

```ts
import type {
  VideoSource,
  SamplingStrategy,
  SceneAlgorithm,
  FrameSelector,
  VideoInfo,
  SampledFrame,
  SceneChange,
  SampleMeta,
  SampleResult,
  SampleOptions,
  SceneDetectOptions,
  SamplerConfig,
  VideoSampler,
} from 'vidsnap-ai';
```

The package targets ES2022 and compiles to CommonJS. It requires Node.js >= 18.

---

## License

MIT
