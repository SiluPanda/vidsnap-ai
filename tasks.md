# vidsnap-ai -- Task Breakdown

This file tracks all implementation tasks derived from SPEC.md. Each task is granular and actionable, grouped by implementation phase.

---

## Phase 1: Project Scaffolding & Core Types

- [ ] **Install runtime dependencies** -- Add `fluent-ffmpeg` as a runtime dependency in `package.json`. | Status: not_done
- [ ] **Install dev dependencies** -- Add `typescript`, `vitest`, `eslint`, `@types/node`, `@types/fluent-ffmpeg`, and `sharp` (for tests) as dev dependencies in `package.json`. | Status: not_done
- [ ] **Configure peer dependencies** -- Add `sharp` (>=0.33.0) as an optional peer dependency in `package.json` with `peerDependenciesMeta`. | Status: not_done
- [ ] **Configure optional dependencies** -- Add `vision-prep` (^0.1.0) as an optional dependency in `package.json`. | Status: not_done
- [ ] **Add CLI binary entry point** -- Add `"bin": { "vidsnap-ai": "dist/cli.js" }` to `package.json`. | Status: not_done
- [ ] **Create src/types.ts** -- Define all TypeScript types: `VideoSource`, `SamplingStrategy`, `SceneAlgorithm`, `FrameSelector`, `SampleOptions`, `SceneDetectOptions`, `SamplerConfig`, `SampleResult`, `SampleMeta`, `SampledFrame`, `SceneChange`, `VideoInfo`, `VideoSampler`. Export all types. | Status: not_done
- [ ] **Create src/errors.ts** -- Define error classes: `VideoNotFoundError` (file path does not exist), `InvalidVideoError` (corrupted or non-video file), `FfmpegNotFoundError` (ffmpeg/ffprobe not installed, include installation instructions for macOS/Ubuntu/Windows in the error message). | Status: not_done
- [ ] **Create directory structure** -- Create all directories specified in the file structure: `src/strategies/`, `src/detection/`, `src/dedup/`, `src/video/`, `src/output/`, `src/__tests__/`, `src/__tests__/strategies/`, `src/__tests__/detection/`, `src/__tests__/dedup/`, `src/__tests__/video/`, `src/__tests__/fixtures/`. | Status: not_done

---

## Phase 2: Video I/O Layer (ffmpeg/ffprobe)

- [ ] **Implement ffmpeg availability check** -- In `src/video/ffmpeg.ts`, create a function that verifies `ffmpeg` is installed and accessible. Throw `FfmpegNotFoundError` with platform-specific installation instructions if not found. | Status: not_done
- [ ] **Implement ffprobe availability check** -- In `src/video/ffprobe.ts`, create a function that verifies `ffprobe` is installed and accessible. Throw `FfmpegNotFoundError` if not found. | Status: not_done
- [ ] **Implement ffprobe metadata extraction** -- In `src/video/ffprobe.ts`, implement a function that runs `ffprobe` on a video file and parses the JSON output into a `VideoInfo` object. Extract: path, duration, width, height, fps, codec, totalFrames (duration * fps), fileSize, bitrate, hasAudio, format. | Status: not_done
- [ ] **Handle Buffer input for ffprobe** -- When the video source is a Buffer instead of a file path, write it to a temporary file, run ffprobe, then clean up the temporary file. | Status: not_done
- [ ] **Implement single-frame extraction** -- In `src/video/ffmpeg.ts`, implement a function that extracts a single frame at a given timestamp as a JPEG or PNG Buffer using `fluent-ffmpeg`. Support configurable output format and JPEG quality. | Status: not_done
- [ ] **Implement batch-frame extraction** -- In `src/video/frame-extractor.ts`, implement a function that extracts multiple frames at specified timestamps in a single `ffmpeg` pass for efficiency. Return an array of Buffers with their timestamps. | Status: not_done
- [ ] **Implement keyframe (I-frame) extraction** -- In `src/video/ffmpeg.ts`, implement I-frame extraction using `ffmpeg -skip_frame nokey`. Return all keyframes as Buffers with timestamps. Support `maxFrames` parameter to select an evenly spaced subset. | Status: not_done
- [ ] **Handle Buffer input for ffmpeg** -- When the video source is a Buffer, write it to a temporary file, extract frames, then clean up. | Status: not_done
- [ ] **Implement frame resizing** -- In `src/video/ffmpeg.ts` or using `sharp`, implement resizing frames to `maxWidth`/`maxHeight` while preserving aspect ratio. | Status: not_done
- [ ] **Create src/video/index.ts** -- Export all video I/O functions from a single barrel file. | Status: not_done
- [ ] **Implement getVideoInfo() function** -- In `src/info.ts`, implement the public `getVideoInfo(video: VideoSource): Promise<VideoInfo>` function. Validate the input, call ffprobe, and return `VideoInfo`. | Status: not_done

---

## Phase 3: Video I/O Tests

- [ ] **Create test fixture generation script** -- In `src/__tests__/fixtures/generate-fixtures.sh`, write a shell script that uses `ffmpeg` to generate: `sample-10s.mp4` (10s video with 3 distinct scenes using different solid colors), `static-5s.mp4` (5s static single-color video), `slides-30s.mp4` (30s with 5 color transitions simulating slide changes). | Status: not_done
- [ ] **Write ffprobe wrapper tests** -- In `src/__tests__/video/ffprobe.test.ts`, test: extracting metadata from a known test video and verifying all fields (duration, resolution, fps, codec, fileSize), handling missing file (throws `VideoNotFoundError`), handling corrupted file (throws `InvalidVideoError`), handling audio-only file (throws `InvalidVideoError`). | Status: not_done
- [ ] **Write ffmpeg wrapper tests** -- In `src/__tests__/video/ffmpeg.test.ts`, test: extracting a single frame at a specific timestamp returns a valid JPEG buffer, extracting a frame at timestamp 0 returns a valid image, extracting a frame beyond video duration is handled gracefully, keyframe extraction returns valid frames, batch extraction returns correct number of frames. | Status: not_done
- [ ] **Write getVideoInfo() tests** -- In `src/__tests__/info.test.ts`, test: returns correct metadata for known test video, throws `VideoNotFoundError` for missing file, throws `InvalidVideoError` for corrupted file, handles Buffer input. | Status: not_done

---

## Phase 4: Basic Sampling Strategies

- [ ] **Implement interval strategy** -- In `src/strategies/interval.ts`, implement fixed-interval sampling. Compute timestamps at `0, intervalSeconds, 2*intervalSeconds, ...` up to video duration. Default `intervalSeconds` is 1.0. | Status: not_done
- [ ] **Implement uniform strategy** -- In `src/strategies/uniform.ts`, implement uniform-count sampling. Compute `count` evenly spaced timestamps: `i * (duration / count)` for i in 0..count-1. Default count is 10. | Status: not_done
- [ ] **Implement keyframe strategy** -- In `src/strategies/keyframe.ts`, implement I-frame extraction strategy. Call the keyframe extractor, optionally subsample if `maxFrames` is specified. | Status: not_done
- [ ] **Implement custom strategy** -- In `src/strategies/custom.ts`, implement custom selector dispatch. Call the user-provided `selector(videoInfo)` function to get timestamps, then extract frames at those timestamps. Validate that the selector function is provided when strategy is 'custom'. | Status: not_done
- [ ] **Create strategy dispatch** -- In `src/strategies/index.ts`, create a dispatcher that routes to the correct strategy implementation based on the `strategy` option. | Status: not_done
- [ ] **Implement maxFrames capping** -- In the strategy dispatch or `sample.ts`, enforce the `maxFrames` ceiling (default: 50) across all strategies. When a strategy produces more frames than `maxFrames`, select an evenly spaced subset. | Status: not_done
- [ ] **Implement minFrames padding** -- In `sample.ts`, when a strategy produces fewer frames than `minFrames` (default: 1), pad with uniformly spaced frames to reach `minFrames`. | Status: not_done

---

## Phase 5: sample() Function & Output

- [ ] **Implement sample() orchestration** -- In `src/sample.ts`, implement the main `sample(video, options?)` function. Steps: (1) validate input, (2) get video info via ffprobe, (3) dispatch to strategy, (4) extract frames at computed timestamps, (5) apply maxFrames/minFrames, (6) format output, (7) build and return `SampleResult` with `frames`, `video`, and `meta`. | Status: not_done
- [ ] **Implement SampleMeta population** -- In `src/sample.ts`, track and populate all `SampleMeta` fields: `strategy`, `candidatesEvaluated`, `framesDeduped`, `sceneChangesDetected`, `processingTimeMs`. Use `performance.now()` or `Date.now()` for timing. | Status: not_done
- [ ] **Implement SampledFrame construction** -- Build each `SampledFrame` with: `buffer`, `timestamp`, `index` (sequential), `mimeType`, `width`, `height`, `byteLength`, `isSceneChange` (false for non-scene strategies), and optional fields. | Status: not_done
- [ ] **Implement base64 output** -- In `src/output/base64.ts`, implement base64 encoding of frame Buffers. Populate `SampledFrame.base64` when `outputBase64: true`. The base64 string must NOT include the `data:` URL prefix. | Status: not_done
- [ ] **Create src/output/index.ts** -- Export all output formatting functions from a barrel file. | Status: not_done
- [ ] **Wire up public exports in src/index.ts** -- Export `sample`, `getVideoInfo`, and all types from `src/index.ts`. | Status: not_done
- [ ] **Implement AbortSignal support** -- In `sample()`, check the `signal` option for cancellation. Abort ffmpeg processes and throw an `AbortError` when the signal is aborted. | Status: not_done

---

## Phase 6: Basic Sampling Strategy Tests

- [ ] **Write interval strategy tests** -- In `src/__tests__/strategies/interval.test.ts`, test: 60s video at 1s interval produces 60 timestamps, 60s video at 5s interval produces 12 timestamps, interval larger than duration produces 1 timestamp at time 0, maxFrames caps the output, timestamps are in ascending order. | Status: not_done
- [ ] **Write uniform strategy tests** -- In `src/__tests__/strategies/uniform.test.ts`, test: count=10 on 60s video produces exactly 10 timestamps, count=1 produces single timestamp at time 0, count greater than total frames handled gracefully, timestamps are evenly spaced. | Status: not_done
- [ ] **Write keyframe strategy tests** -- In `src/__tests__/strategies/keyframe.test.ts`, test: extraction produces valid frames with timestamps, maxFrames limits output, frames are in timestamp order. | Status: not_done
- [ ] **Write sample() function tests** -- In `src/__tests__/sample.test.ts`, test: sample with interval strategy returns SampleResult with correct structure, frames array contains valid SampledFrame objects, meta contains correct strategy name and processing time, maxFrames is respected, minFrames padding works, outputFormat jpeg produces valid JPEG buffers (FF D8 magic bytes), outputFormat png produces valid PNG buffers (89 50 4E 47 magic bytes), quality parameter affects JPEG file size, outputBase64 true populates base64 field, outputBase64 false leaves base64 undefined. | Status: not_done

---

## Phase 7: Scene Change Detection Algorithms

- [ ] **Implement histogram comparison** -- In `src/detection/histogram.ts`, implement color histogram computation (64 bins per R/G/B channel = 192 bins) and chi-squared distance comparison. Resize frames to 320x240 for comparison. Normalize distance to [0.0, 1.0]. Use `sharp` for pixel data extraction. | Status: not_done
- [ ] **Implement pixel difference** -- In `src/detection/pixel.ts`, implement mean absolute pixel difference between two frames. Resize both frames to 320x240. Normalize by dividing by 255 to get [0.0, 1.0] range. Use `sharp` for pixel data extraction. | Status: not_done
- [ ] **Implement perceptual hash (pHash)** -- In `src/detection/phash.ts`, implement 64-bit pHash: resize to 32x32 grayscale, apply DCT, take top-left 8x8 coefficients, compute median, set bits based on median comparison. Compute Hamming distance between hashes. Normalize distance to [0.0, 1.0] by dividing by 64. | Status: not_done
- [ ] **Implement SSIM** -- In `src/detection/ssim.ts`, implement structural similarity index computation. Resize frames to 320x240 grayscale. Compute local means, variances, and covariance over sliding windows. Use stability constants C1 and C2. Return SSIM value in [0.0, 1.0]. Convert to change score: `1.0 - SSIM`. | Status: not_done
- [ ] **Implement algorithm dispatch** -- In `src/detection/index.ts`, create a function that dispatches to the correct detection algorithm based on the `algorithm` option. | Status: not_done
- [ ] **Implement multi-algorithm consensus** -- In `src/detection/index.ts`, implement consensus logic: run multiple algorithms independently, count agreements per frame pair, report scene change only when count >= `consensus` threshold. | Status: not_done
- [ ] **Handle missing sharp gracefully** -- In detection modules, check for `sharp` availability. When `sharp` is not installed, throw a descriptive error explaining that scene change detection requires `sharp`. Fall back to reduced feature set (only interval/uniform/keyframe/custom strategies). | Status: not_done

---

## Phase 8: Scene Change Detection Tests

- [ ] **Write histogram comparison tests** -- In `src/__tests__/detection/histogram.test.ts`, test: two identical frames produce distance 0.0, two completely different frames (black vs white) produce distance near 1.0, gradual brightness change produces small distance, hard cut produces distance above 0.3. | Status: not_done
- [ ] **Write pixel difference tests** -- In `src/__tests__/detection/pixel.test.ts`, test: identical frames produce difference 0.0, all-black vs all-white produces difference 1.0, small object movement in static scene produces difference below 0.1. | Status: not_done
- [ ] **Write pHash tests** -- In `src/__tests__/detection/phash.test.ts`, test: identical images produce Hamming distance 0, structurally similar images produce small distance, completely different images produce large distance, hash is 64 bits. | Status: not_done
- [ ] **Write SSIM tests** -- In `src/__tests__/detection/ssim.test.ts`, test: identical frames produce SSIM 1.0 (change score 0.0), completely different frames produce SSIM near 0.0 (change score near 1.0), frames with only brightness change produce high SSIM (change score below typical threshold). | Status: not_done
- [ ] **Write consensus tests** -- In `src/__tests__/detection/consensus.test.ts`, test: scene change detected by 3 of 3 algorithms passes consensus of 2, scene change detected by 1 of 3 fails consensus of 2, consensus of 1 passes with any single algorithm detection. | Status: not_done

---

## Phase 9: Scene Change Strategy & detectScenes()

- [ ] **Implement scene change strategy** -- In `src/strategies/scene.ts`, implement scene-based sampling. Extract frames at `analyzeInterval` (default 0.25s), run scene change detection on consecutive frame pairs, select frames where change score exceeds `threshold`. Always include the first frame. | Status: not_done
- [ ] **Implement detectScenes() function** -- In `src/scenes.ts`, implement the public `detectScenes(video, options?)` function. Analyze the video for scene changes and return an array of `SceneChange` objects with `timestamp`, `score`, `algorithm`, and `frameIndex`. | Status: not_done
- [ ] **Wire up detectScenes() exports** -- Export `detectScenes` from `src/index.ts`. | Status: not_done
- [ ] **Write scene strategy tests** -- In `src/__tests__/strategies/scene.test.ts`, test: video with 3 hard cuts produces approximately 4 frames (first + 3 cuts), threshold affects sensitivity (lower threshold = more frames), analyzeInterval affects granularity, first frame is always included. | Status: not_done
- [ ] **Write detectScenes() tests** -- In `src/__tests__/scenes.test.ts`, test: returns SceneChange array with correct structure, timestamps are in ascending order, scores are in [0.0, 1.0] range, algorithm field matches the configured algorithm, handles video with no scene changes (returns empty array). | Status: not_done

---

## Phase 10: Frame Deduplication

- [ ] **Implement pHash computation for dedup** -- In `src/dedup/phash.ts`, implement perceptual hash computation (can reuse or share with detection/phash.ts). Compute a 64-bit hash for a frame Buffer. | Status: not_done
- [ ] **Implement deduplication logic** -- In `src/dedup/index.ts`, implement the dedup post-processing step. Iterate candidate frames in timestamp order. For each candidate, compute pHash similarity against all already-selected frames. If similarity > `dedupThreshold` (default 0.9), discard the candidate. First frame is always kept. | Status: not_done
- [ ] **Integrate dedup into sample()** -- In `src/sample.ts`, apply deduplication as a post-processing step after strategy selection (when `dedup: true`, which is the default). Track `framesDeduped` in SampleMeta. | Status: not_done
- [ ] **Populate similarity field** -- In each `SampledFrame`, populate the `similarity` field with the pHash similarity to the previous selected frame. | Status: not_done
- [ ] **Write deduplication tests** -- In `src/__tests__/dedup/dedup.test.ts`, test: two identical frames results in second being removed, two very different frames results in both kept, sequence of gradually changing frames removes similar intermediates, `dedup: false` keeps all frames, `dedupThreshold: 1.0` removes only exact duplicates, `dedupThreshold: 0.0` removes everything except first frame, first frame is always kept. | Status: not_done

---

## Phase 11: Hybrid Strategy

- [ ] **Implement hybrid strategy** -- In `src/strategies/hybrid.ts`, implement hybrid sampling. (1) Compute interval-based timestamps (default `intervalSeconds: 2.0`), (2) detect scene changes, (3) merge both timestamp sets, (4) remove timestamps closer than `minGap` (default 0.5s), (5) extract frames at remaining timestamps. | Status: not_done
- [ ] **Implement timestamp merging and minGap dedup** -- Merge interval and scene change timestamps, sort, then remove any timestamps that are within `minGap` seconds of each other (keeping the earlier one, preferring scene change timestamps). | Status: not_done
- [ ] **Write hybrid strategy tests** -- In `src/__tests__/strategies/hybrid.test.ts`, test: produces frames from both interval and scene change sources, minGap prevents clustering, scene change frames are included alongside interval frames, result contains both scene change and non-scene-change frames, maxFrames is respected. | Status: not_done

---

## Phase 12: Budget Strategy

- [ ] **Implement built-in token estimation** -- In `src/strategies/budget.ts`, implement conservative token-per-frame estimates for each provider/detail combination: OpenAI low=85, OpenAI high=765, Anthropic=1049, Gemini=258. Adjust estimate based on video resolution when known. | Status: not_done
- [ ] **Implement vision-prep token estimation fallback** -- In `src/strategies/budget.ts`, try to import `vision-prep` and use its `estimateTokens()` for accurate estimates. Fall back to built-in estimates when `vision-prep` is not available. | Status: not_done
- [ ] **Implement greedy diversity-maximization** -- In `src/strategies/budget.ts`, implement the farthest-point greedy algorithm: (1) compute maxFrames from budget/tokensPerFrame, (2) extract dense candidates at 0.5s intervals, (3) compute pHash for all candidates, (4) greedily select frames that maximize minimum Hamming distance from already-selected frames, (5) sort selected frames by timestamp. | Status: not_done
- [ ] **Populate budget metadata** -- In budget strategy, populate `SampleMeta` fields: `tokenBudget`, `estimatedTokensUsed`, `tokensPerFrame`. | Status: not_done
- [ ] **Write budget strategy tests** -- In `src/__tests__/strategies/budget.test.ts`, test: budget of 765 with OpenAI high-detail produces 1 frame, budget of 5000 produces floor(5000/765)=6 frames, budget of 0 produces 0 frames, selected frames are sorted by timestamp, selected frames are maximally diverse (verify via pHash distances), different providers produce different frame counts for the same budget. | Status: not_done

---

## Phase 13: createSampler() Factory

- [ ] **Implement createSampler() factory** -- In `src/factory.ts`, implement `createSampler(config: SamplerConfig): VideoSampler`. Return an object with `sample()`, `sampleStream()`, `detectScenes()`, and `getVideoInfo()` methods. The config serves as defaults, overridable per-call. | Status: not_done
- [ ] **Implement config merging** -- When a per-call option is provided, it overrides the factory config. When not provided, the factory config value is used. | Status: not_done
- [ ] **Export createSampler from index.ts** -- Add `createSampler` to the public exports in `src/index.ts`. | Status: not_done
- [ ] **Write factory tests** -- In `src/__tests__/factory.test.ts`, test: factory-created sampler uses config defaults, per-call options override config, all four methods (sample, sampleStream, detectScenes, getVideoInfo) are present and callable, multiple videos can be sampled with the same sampler instance. | Status: not_done

---

## Phase 14: Streaming Mode (sampleStream)

- [ ] **Implement sampleStream() function** -- In `src/stream.ts`, implement `sampleStream(video, options?): AsyncIterable<SampledFrame>`. Extract and yield frames progressively one at a time, keeping memory usage proportional to a single frame. | Status: not_done
- [ ] **Implement streaming for interval/uniform strategies** -- For strategies with known timestamps upfront (interval, uniform, custom), extract frames sequentially and yield each as it's ready. | Status: not_done
- [ ] **Implement streaming for scene strategy** -- For scene-based strategies, analyze frames sequentially, detect scene changes on the fly, and yield frames at detected scene boundaries. | Status: not_done
- [ ] **Implement streaming deduplication** -- Apply dedup in streaming mode by maintaining a running set of pHashes of already-yielded frames. Compare each candidate against the set before yielding. | Status: not_done
- [ ] **Implement AbortSignal support in streaming** -- Check the signal for cancellation between frame extractions. Stop yielding and clean up when aborted. | Status: not_done
- [ ] **Export sampleStream from index.ts** -- Add `sampleStream` to the public exports in `src/index.ts`. | Status: not_done
- [ ] **Write sampleStream() tests** -- In `src/__tests__/stream.test.ts`, test: yields SampledFrame objects one at a time, frames are in timestamp order, all frames are valid images, total frame count matches equivalent sample() call, memory usage stays bounded (does not load all frames at once), AbortSignal cancels iteration. | Status: not_done

---

## Phase 15: vision-prep Integration (Output)

- [ ] **Implement vision-prep integration** -- In `src/output/provider.ts`, implement optional integration with `vision-prep`. Try to dynamically import `vision-prep`. When available, pass each frame through `vision-prep`'s `prepare()` function. Populate `SampledFrame.tokens`, `SampledFrame.cost`, and `SampledFrame.contentBlock`. | Status: not_done
- [ ] **Implement OpenAI content block format** -- When `prepareForProvider: 'openai'`, produce content blocks with structure `{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...', detail: 'high'|'low' } }`. | Status: not_done
- [ ] **Implement Anthropic content block format** -- When `prepareForProvider: 'anthropic'`, produce content blocks with structure `{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '...' } }`. | Status: not_done
- [ ] **Implement Gemini content block format** -- When `prepareForProvider: 'gemini'`, produce content blocks with structure `{ inlineData: { mimeType: 'image/jpeg', data: '...' } }`. | Status: not_done
- [ ] **Handle missing vision-prep gracefully** -- When `vision-prep` is not installed and `prepareForProvider` is specified, fall back to manual base64 encoding and content block construction without token/cost estimation. When `vision-prep` is not installed and it is NOT requested, return frames as raw Buffers without any provider-specific fields. | Status: not_done
- [ ] **Populate aggregate token metadata** -- When provider preparation is active, compute total `estimatedTokensUsed` in `SampleMeta` by summing per-frame token counts. | Status: not_done
- [ ] **Write vision-prep integration tests** -- Test: `prepareForProvider: 'openai'` produces correct content block structure, `prepareForProvider: 'anthropic'` produces correct structure, `prepareForProvider: 'gemini'` produces correct structure, token counts are populated, cost is populated when model is specified, without vision-prep frames are returned as raw Buffers. | Status: not_done

---

## Phase 16: CLI Implementation

- [ ] **Implement CLI entry point** -- In `src/cli.ts`, set up the CLI with a shebang line (`#!/usr/bin/env node`). Parse arguments for three commands: `sample`, `scenes`, `info`. Use a lightweight arg parser (e.g., manual parsing or a minimal library). | Status: not_done
- [ ] **Implement `sample` command** -- Parse all strategy options (`--strategy`, `--max-frames`, `--interval`, `--threshold`, `--algorithm`, `--count`, `--token-budget`, `--provider`, `--detail`), dedup options (`--no-dedup`, `--dedup-threshold`), and output options (`--output-dir`, `--format`, `--quality`, `--json`, `--base64`). Call `sample()` and output results. | Status: not_done
- [ ] **Implement file output for `sample` command** -- Write extracted frames as image files to `--output-dir` (default `./frames/`). Create the directory if it does not exist. Name files sequentially (e.g., `frame-001.jpg`). | Status: not_done
- [ ] **Implement JSON output for `sample` command** -- When `--json` is specified, output frame metadata as JSON to stdout. Include timestamps, indices, scene change scores, and optionally base64 data (when `--base64` is also specified). | Status: not_done
- [ ] **Implement human-readable output for `sample` command** -- Display progress: video info header, strategy info, scene detection progress, extraction progress, dedup summary, frame listing with timestamps and scene change scores, total frame count and processing time. Match the format shown in the spec. | Status: not_done
- [ ] **Implement `scenes` command** -- Parse options (`--algorithm`, `--threshold`, `--analyze-interval`, `--format`). Call `detectScenes()` and output results. Support `json` and `text` output formats. | Status: not_done
- [ ] **Implement `info` command** -- Parse options (`--json`). Call `getVideoInfo()` and output metadata. Support JSON and human-readable output. | Status: not_done
- [ ] **Implement `--version` flag** -- Read version from `package.json` and print it. Exit with code 0. | Status: not_done
- [ ] **Implement `--help` flag** -- Print usage information for each command. Exit with code 0. | Status: not_done
- [ ] **Implement exit codes** -- Exit with code 0 on success, code 1 on processing error (video could not be read/decoded/processed), code 2 on configuration error (invalid flags, missing arguments, unsupported format). | Status: not_done
- [ ] **Handle invalid input in CLI** -- Validate video file path exists before processing. Show descriptive error messages for: missing video file argument, invalid strategy name, invalid option values, missing required options (e.g., `--token-budget` for budget strategy). | Status: not_done

---

## Phase 17: CLI Tests

- [ ] **Write CLI `sample` command tests** -- In `src/__tests__/cli.test.ts`, test: `vidsnap-ai sample video.mp4` produces frame files in `./frames/`, `--output-dir ./out` writes to the specified directory, `--json` outputs valid JSON to stdout, `--strategy` flag is respected, `--max-frames` limits output, different strategies produce different results. | Status: not_done
- [ ] **Write CLI `scenes` command tests** -- Test: `vidsnap-ai scenes video.mp4` outputs scene change timestamps, `--format json` outputs valid JSON, `--threshold` affects sensitivity. | Status: not_done
- [ ] **Write CLI `info` command tests** -- Test: `vidsnap-ai info video.mp4` outputs video metadata, `--json` outputs valid JSON with all expected fields. | Status: not_done
- [ ] **Write CLI error handling tests** -- Test: invalid file path produces exit code 1, invalid flags produce exit code 2, `--version` prints version and exits 0, `--help` prints help and exits 0, missing video argument produces exit code 2. | Status: not_done

---

## Phase 18: Edge Cases & Error Handling

- [ ] **Handle very short video (< 1 second)** -- Ensure at least 1 frame is extracted from videos shorter than 1 second. All strategies should produce at least `minFrames` frames. | Status: not_done
- [ ] **Handle very long video (2+ hours)** -- Verify that `sample()` completes in reasonable time and `sampleStream()` processes without memory issues for long videos. | Status: not_done
- [ ] **Handle static video (no visual changes)** -- A 60-second static video should produce 1 frame after deduplication (all frames are identical). Without dedup, interval/uniform strategies still produce their expected count. | Status: not_done
- [ ] **Handle constant rapid changes** -- Videos where every frame is different: `maxFrames` must cap the output regardless of how many scene changes are detected. | Status: not_done
- [ ] **Handle corrupted video file** -- Throw `InvalidVideoError` with a descriptive message when the video file is corrupted or unreadable. | Status: not_done
- [ ] **Handle non-video file with video extension** -- Throw `InvalidVideoError` when a file has a .mp4 extension but is not a valid video. | Status: not_done
- [ ] **Handle video with no video stream** -- Throw `InvalidVideoError` when the file is audio-only (has no video stream). | Status: not_done
- [ ] **Handle video without ffmpeg installed** -- Throw `FfmpegNotFoundError` with platform-specific installation instructions (brew for macOS, apt for Ubuntu, choco for Windows). | Status: not_done
- [ ] **Handle variable frame rate video** -- Ensure timestamps remain accurate for videos with variable frame rate. | Status: not_done
- [ ] **Handle video with resolution change mid-stream** -- Handle gracefully (use the initial resolution, or handle per-frame resolution differences). | Status: not_done
- [ ] **Write edge case tests** -- In `src/__tests__/sample.test.ts` or a dedicated edge case file, write tests for all the above edge cases. | Status: not_done

---

## Phase 19: Performance Optimization

- [ ] **Implement downscaled comparison frames** -- Ensure all scene change detection algorithms operate on 320x240 downscaled frames, not native resolution frames. This is a 27x data reduction for 1080p video. | Status: not_done
- [ ] **Implement parallel frame extraction** -- For strategies with known timestamps (interval, uniform), extract multiple frames in a single ffmpeg pass to avoid repeated seeking. | Status: not_done
- [ ] **Implement seek-based extraction** -- For interval and uniform strategies, use ffmpeg seeking to jump to requested timestamps rather than sequential decoding. | Status: not_done
- [ ] **Verify performance targets** -- Benchmark against the spec's performance targets: 10s video hybrid < 2s, 60s video hybrid < 5s, 60s interval < 3s, 60s keyframe < 1s, 60s detectScenes < 4s, getVideoInfo < 200ms, 10min hybrid < 15s. | Status: not_done
- [ ] **Verify memory usage** -- Ensure peak memory for 20-frame extraction from 1080p is approximately 10-15 MB. Ensure sampleStream() memory is bounded at ~1-2 MB regardless of video length. | Status: not_done

---

## Phase 20: Documentation

- [ ] **Create README.md** -- Write comprehensive README with: package description, installation instructions (npm + ffmpeg system dependency), quick start examples, API reference for all public functions (sample, sampleStream, detectScenes, getVideoInfo, createSampler), sampling strategy guide with recommendations by video type, CLI usage with all commands and options, integration examples (vision-prep, multimodal-msg, prompt-price, audio-chunker), configuration defaults table, peer/optional dependency explanations. | Status: not_done
- [ ] **Add JSDoc comments to all public functions** -- Add complete JSDoc comments to `sample()`, `sampleStream()`, `detectScenes()`, `getVideoInfo()`, `createSampler()` in their respective source files. Include parameter descriptions, return type descriptions, and usage examples. | Status: not_done
- [ ] **Add JSDoc comments to all type definitions** -- Add JSDoc comments to every field in `SampleOptions`, `SampledFrame`, `SampleResult`, `SampleMeta`, `VideoInfo`, `SceneChange`, and other exported types, matching the spec's documentation. | Status: not_done
- [ ] **Add inline code comments** -- Add explanatory comments for non-obvious algorithms: chi-squared histogram distance formula, DCT-based perceptual hash steps, SSIM formula, greedy farthest-point selection, consensus logic. | Status: not_done

---

## Phase 21: Build, Lint & CI

- [ ] **Configure ESLint** -- Set up ESLint configuration for TypeScript. Ensure `npm run lint` passes on all source files. | Status: not_done
- [ ] **Verify TypeScript compilation** -- Ensure `npm run build` (tsc) compiles all source files without errors. Verify that declaration files are generated in `dist/`. | Status: not_done
- [ ] **Verify test suite passes** -- Run `npm run test` (vitest) and ensure all tests pass. | Status: not_done
- [ ] **Verify CLI binary works** -- After build, verify that `node dist/cli.js` works and that the bin entry in package.json correctly links to the CLI. | Status: not_done
- [ ] **Verify package publishes correctly** -- Run `npm pack` and inspect the tarball to ensure only `dist/` files are included (per the `files` field in package.json). Verify that the package can be installed and imported. | Status: not_done

---

## Phase 22: Version Bump & Publishing Preparation

- [ ] **Bump version for initial release** -- Bump `package.json` version appropriately as features are completed across phases (0.1.0 for Phase 1 core, 0.2.0 for scene detection, 0.3.0 for hybrid/dedup/budget, 0.4.0 for streaming/CLI/integrations, 1.0.0 for production readiness). | Status: not_done
- [ ] **Final pre-publish checklist** -- Verify: all tests pass, lint passes, build succeeds, README is complete, version is bumped, `files` field in package.json only includes `dist/`, CLI binary works, `prepublishOnly` script runs build. | Status: not_done
