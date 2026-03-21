# vidsnap-ai

Smart video frame sampler for vision AI analysis.

Extract the most informative frames from any video using intelligent sampling strategies -- uniform intervals, keyframe extraction, scene change detection, hybrid approaches, or token-budget-aware selection. Designed as a preprocessing step for multimodal LLM pipelines (OpenAI, Anthropic, Gemini).

## Installation

```bash
npm install vidsnap-ai
```

### Prerequisites

**ffmpeg and ffprobe must be installed** on your system and available in `$PATH`.

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

## Quick Start

```ts
import { createSampler } from 'vidsnap-ai';

// Create a sampler with default configuration
const sampler = createSampler({
  strategy: 'hybrid',
  maxFrames: 20,
  outputFormat: 'jpeg',
  quality: 85,
});

// Sample frames from a video
const result = await sampler.sample('./lecture.mp4');

console.log(`Extracted ${result.frames.length} frames`);
console.log(`Video duration: ${result.video.duration}s`);
console.log(`Strategy: ${result.meta.strategy}`);
console.log(`Processing time: ${result.meta.processingTimeMs}ms`);

for (const frame of result.frames) {
  console.log(`  Frame ${frame.index}: ${frame.timestamp}s (${frame.width}x${frame.height})`);
}
```

### Detect Scenes

```ts
const scenes = await sampler.detectScenes('./movie-clip.mp4', {
  algorithm: 'histogram',
  threshold: 0.3,
});

for (const scene of scenes) {
  console.log(`Scene change at ${scene.timestamp}s (score: ${scene.score})`);
}
```

### Get Video Info

```ts
const info = await sampler.getVideoInfo('./video.mp4');
console.log(info);
// { path, duration, width, height, fps, codec, totalFrames, fileSize, bitrate, hasAudio, format }
```

## Available Exports

### Types

- `VideoSource` -- Video input: file path (`string`) or `Buffer`
- `SamplingStrategy` -- `'interval' | 'scene' | 'keyframe' | 'hybrid' | 'uniform' | 'budget' | 'custom'`
- `SceneAlgorithm` -- `'histogram' | 'pixel' | 'phash' | 'ssim'`
- `FrameSelector` -- Custom frame selector function type
- `VideoInfo` -- Video metadata (duration, resolution, fps, codec, etc.)
- `SampledFrame` -- Extracted frame with buffer, timestamp, dimensions, and metadata
- `SceneChange` -- Scene change detection result
- `SampleMeta` -- Sampling run metadata (strategy, timing, dedup stats)
- `SampleResult` -- Complete sampling result (`frames`, `video`, `meta`)
- `SampleOptions` -- Options for a single `sample()` call
- `SceneDetectOptions` -- Options for scene detection
- `SamplerConfig` -- Factory configuration (extends `SampleOptions`)
- `VideoSampler` -- Sampler interface (`sample`, `sampleStream`, `detectScenes`, `getVideoInfo`)

### Error Classes

- `VideoNotFoundError` -- Thrown when the video file path does not exist
- `InvalidVideoError` -- Thrown when the file is corrupted or not a valid video
- `FfmpegNotFoundError` -- Thrown when ffmpeg/ffprobe is not installed (includes platform-specific installation instructions)

## Sampling Strategies

| Strategy | Description | Best For |
|---|---|---|
| `uniform` | Evenly spaced frames across the video | General purpose, predictable output |
| `interval` | Fixed time interval between frames | Surveillance, time-lapse analysis |
| `keyframe` | Extract I-frames (keyframes) from the video stream | Fast extraction, codec-aware sampling |
| `scene` | Detect scene changes and sample at boundaries | Movies, presentations, lectures |
| `hybrid` | Combine interval + scene detection, deduplicate | Best overall quality for vision AI |
| `budget` | Maximize diversity within a vision token budget | Cost-constrained LLM pipelines |
| `custom` | User-provided frame selector function | Domain-specific sampling logic |

## Configuration Defaults

| Option | Default | Description |
|---|---|---|
| `strategy` | `'hybrid'` | Sampling strategy |
| `maxFrames` | `50` | Maximum frames to return |
| `minFrames` | `1` | Minimum frames to return |
| `intervalSeconds` | `1.0` | Seconds between frames (interval/hybrid) |
| `threshold` | `0.3` | Scene change detection threshold |
| `algorithm` | `'histogram'` | Scene detection algorithm |
| `count` | `10` | Frame count for uniform strategy |
| `dedup` | `true` | Enable frame deduplication |
| `dedupThreshold` | `0.9` | Dedup similarity threshold |
| `outputFormat` | `'jpeg'` | Output image format |
| `quality` | `85` | JPEG quality (1-100) |
| `outputBase64` | `false` | Include base64-encoded images |

## Peer Dependencies

- **sharp** (>=0.33.0, optional) -- Required for scene change detection algorithms (`scene`, `hybrid` strategies) and frame deduplication. Not needed for `uniform`, `interval`, `keyframe`, or `custom` strategies.

## License

MIT
