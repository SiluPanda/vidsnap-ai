# vidsnap-ai -- Specification

## 1. Overview

`vidsnap-ai` is a smart video frame sampler that extracts representative frames from video files for vision LLM analysis. Given a video file (file path or Buffer) and a sampling strategy, it analyzes the video for scene changes, selects the most informative frames using configurable algorithms, deduplicates near-identical frames, optionally resizes and base64-encodes the output, and returns an array of `SampledFrame` objects ready to send to vision LLM APIs. It answers the question "which frames from this video should I send to GPT-4o/Claude/Gemini for analysis?" with a single function call: `sample('./video.mp4', { strategy: 'hybrid', maxFrames: 20 })`, returning frames that capture the video's key visual moments while minimizing token cost.

The gap this package fills is specific and well-defined. To analyze a video with a vision LLM, the developer must extract frames as images and send them as part of a multimodal message. A naive approach -- extracting every frame -- is catastrophically wasteful. A 60-second video at 30 fps produces 1,800 frames. Each frame costs 85 to 2,091 vision tokens depending on provider and dimensions. Sending all 1,800 frames to OpenAI at high detail would cost 153,000 to 1,988,550 tokens -- far exceeding most context windows and costing $0.38 to $4.97 per minute of video at GPT-4o pricing. Most of those frames are nearly identical: a talking head moves slightly between consecutive frames, a slide presentation shows the same slide for 30 seconds, a security camera captures an empty room for minutes at a time. Smart sampling selects the 10-30 frames that actually capture distinct visual content -- scene transitions, new slides, significant motion events -- reducing token cost by 60-180x while preserving the information the LLM needs to understand the video.

The existing npm ecosystem offers no solution for this problem. `ffmpeg-extract-frames` extracts frames at fixed time intervals but has no awareness of visual content -- it extracts equally from static and dynamic scenes, wasting budget on redundant frames while potentially missing rapid scene changes. `video-thumbnail-generator` produces preview thumbnails, not analysis-ready frame sets. Python's `PySceneDetect` provides scene change detection but is not available in the Node.js ecosystem and does not produce LLM-ready output. Developers building video analysis pipelines in Node.js currently write hundreds of lines of bespoke code combining `fluent-ffmpeg` for frame extraction, `sharp` or pixel comparison libraries for scene detection, and manual base64 encoding -- repeating this work in every video-capable application.

`vidsnap-ai` provides both a TypeScript/JavaScript API for programmatic use and a CLI for terminal-based frame extraction. The API returns structured `SampledFrame` objects with frame image data, timestamps, scene change metadata, and similarity scores. A streaming mode extracts frames progressively for long videos. A factory function `createSampler` enables pre-configuring sampling parameters for repeated use. Integration with `vision-prep` (from this monorepo) provides per-provider image optimization and token cost estimation. Integration with `multimodal-msg` enables direct embedding of sampled frames into multimodal LLM message arrays.

---

## 2. Goals and Non-Goals

### Goals

- Provide a `sample(video, options?)` function that reads a video file, analyzes it for visual content variation, selects representative frames using a configurable strategy, deduplicates near-identical frames, and returns an array of `SampledFrame` objects with image data, timestamps, and metadata.
- Provide seven sampling strategies: `interval` (fixed time interval), `scene` (scene change detection), `keyframe` (codec I-frame extraction), `hybrid` (interval + scene change, the default), `uniform` (exactly N evenly spaced frames), `budget` (maximize coverage within a token budget), and `custom` (user-provided frame selection function).
- Provide a `detectScenes(video, options?)` function that analyzes a video for scene changes and returns an array of `SceneChange` objects with timestamps, change magnitude, and detection algorithm metadata -- useful for analysis, visualization, or custom sampling logic.
- Provide a `getVideoInfo(video)` function that extracts video metadata (duration, resolution, frame rate, codec, file size, total frame count) without extracting any frames.
- Provide a `sampleStream(video, options?)` function that returns an `AsyncIterable<SampledFrame>`, extracting and yielding frames progressively. Essential for long videos where loading all frames into memory at once is impractical.
- Provide a `createSampler(config)` factory function that returns a pre-configured `VideoSampler` instance, avoiding repeated option specification when sampling multiple videos with the same parameters.
- Implement scene change detection using four algorithms: histogram difference (color histogram chi-squared distance), pixel difference (mean absolute pixel difference), perceptual hash comparison (pHash Hamming distance), and structural similarity (SSIM). Support configurable algorithm selection and multi-algorithm consensus.
- Implement frame deduplication using perceptual hashing. After sampling, compare selected frames pairwise and remove frames that are too similar to an already-selected frame. This eliminates redundant frames from slow pans, zooms, and static scenes.
- Output frames in LLM-ready formats: raw Buffer, base64-encoded string, and provider-formatted content blocks (via `vision-prep` integration). Each frame carries its timestamp, sequential index, scene change score, and similarity score relative to the previous selected frame.
- Provide a CLI (`vidsnap-ai`) for extracting frames from video files, outputting as image files to a directory, or as JSON metadata to stdout.
- Optionally resize frames to provider-optimal dimensions via `vision-prep` integration. When `vision-prep` is available, frames are resized, compressed, and token-cost-estimated automatically.
- Support token budget mode: the caller specifies a maximum token budget for the entire video (e.g., 5,000 tokens), and the sampler selects frames that maximize visual coverage within that budget.
- Target Node.js 18+. Use `fluent-ffmpeg` with a system-installed `ffmpeg` binary for video decoding and frame extraction. Use `sharp` for image processing, scene change detection computations, and perceptual hashing.

### Non-Goals

- **Not a video player or editor.** This package extracts frames from videos for LLM analysis. It does not play, transcode, trim, concatenate, add subtitles, apply filters, or perform any video manipulation beyond frame extraction. For video editing, use `ffmpeg` directly or a video editing library.
- **Not a computer vision library.** This package detects scene changes using pixel-level, histogram, and perceptual hash comparisons. It does not perform object detection, face recognition, optical character recognition, motion tracking, or semantic scene understanding. The scene change detection is a signal for frame selection, not a general-purpose CV pipeline.
- **Not an LLM client.** This package produces frames ready for LLM consumption. It does not make API calls to OpenAI, Anthropic, Gemini, or any other provider. The caller sends the extracted frames using their preferred SDK.
- **Not a video streaming server.** This package reads video files from disk or Buffers. It does not accept live video streams (RTSP, WebRTC, HLS), capture from cameras, or handle network video protocols. For live video analysis, the caller must first save frames to disk or Buffer and then pass them to `vidsnap-ai`.
- **Not an image preparation library.** Frame resizing, compression, base64 encoding, and provider-specific formatting are delegated to `vision-prep` when it is available. `vidsnap-ai` focuses on selecting which frames to extract, not on optimizing how those frames are encoded. Without `vision-prep`, frames are returned as raw Buffers.
- **Not a video search or indexing engine.** While the extracted frames can be used to build a video search index, this package does not store, query, or rank frames. It extracts and returns them; the caller decides what to do with them.

---

## 3. Target Users and Use Cases

### Video Analysis Application Developers

Developers building applications that analyze video content using vision LLMs -- video Q&A systems, content understanding pipelines, video summarization tools. These developers need to convert a video file into a set of representative images that capture the video's visual content without exceeding token budgets. A typical integration replaces 200+ lines of manual ffmpeg frame extraction, pixel comparison, and deduplication code with a single `sample()` call.

### Content Moderation Teams

Teams building automated content moderation pipelines that screen uploaded videos for policy violations. A 10-minute user-uploaded video must be checked for inappropriate content, but sending every frame to a vision LLM is prohibitively expensive. Scene-change-based sampling extracts frames at visual transitions -- where new content appears -- capturing exactly the moments where policy violations are most likely to be introduced. This reduces the number of frames from thousands to tens while maintaining high detection coverage.

### Lecture and Presentation Analysis

Teams building educational technology that processes recorded lectures and presentations. Slide-based presentations are ideal for smart sampling: the visual content changes only when slides transition. Scene change detection captures each unique slide exactly once, regardless of how long the presenter dwells on it. A 60-minute lecture with 30 slides produces approximately 30 frames -- one per slide transition -- instead of 108,000 frames at 30 fps.

### Surveillance and Security Footage Analysis

Security teams analyzing hours of surveillance footage for incidents. Surveillance cameras often record static scenes for extended periods, with occasional events of interest (person entering, object moved, lighting change). Scene change detection identifies exactly when the visual content changes, extracting frames only at those moments. Eight hours of mostly-static footage might produce 50-200 frames covering every visual event, instead of 864,000 frames at 30 fps.

### Video Search and Indexing

Teams building video search systems that need to generate visual descriptions or embeddings for video content. Each video in the catalog needs a set of representative frames that capture its visual content for LLM-based description generation or embedding computation. Budget-aware sampling ensures each video consumes a predictable number of tokens, enabling cost-controlled batch processing of large video libraries.

### CLI and Script Users

Developers writing shell scripts or automation that extract representative frames from videos. The CLI provides a scriptable interface: extract frames from a video file, write them to a directory as image files, and output metadata as JSON for downstream processing. Useful for batch processing video collections, generating frame datasets for fine-tuning, or quick visual inspection of video content.

---

## 4. Core Concepts

### Frame

A frame is a single image extracted from a video at a specific timestamp. In video encoding, a frame is one picture in the sequence of pictures that compose the video. Videos are typically encoded at 24, 25, 30, or 60 frames per second. Each frame is a complete image with the same resolution as the video. `vidsnap-ai` extracts frames as image Buffers (JPEG or PNG) using `ffmpeg`, and attaches metadata describing the frame's position in the video and its relationship to other selected frames.

### Sampling Strategy

A sampling strategy is the algorithm that determines which frames to extract from a video. Different strategies optimize for different properties: fixed intervals produce predictable output, scene change detection captures visual transitions, keyframe extraction leverages codec decisions, and budget-aware sampling minimizes cost. The strategy is the most important configuration choice -- it determines which visual information is preserved and which is discarded.

### Scene Change

A scene change (also called a shot boundary or cut) is a point in the video where the visual content changes significantly between consecutive frames. Scene changes include hard cuts (instantaneous transition to a different shot), dissolves (gradual blend between two shots), and content transitions (a new slide appearing, a person entering the frame, significant camera movement). `vidsnap-ai` detects scene changes by comparing consecutive frames using pixel-level, histogram-based, or perceptual hash algorithms. Each scene change is characterized by a timestamp and a magnitude score indicating how different the new content is from the previous content.

### Scene Change Threshold

The scene change threshold is a numeric value (0.0 to 1.0) that determines how much visual difference between consecutive frames qualifies as a scene change. A threshold of 0.3 means that frames must differ by at least 30% (according to the chosen algorithm's metric) to be considered a scene change. Lower thresholds detect more changes (including subtle movements and gradual transitions); higher thresholds detect only dramatic changes (hard cuts, slide transitions). The optimal threshold depends on the video content: talking-head videos with a static background need higher thresholds (0.4-0.6) to avoid flagging head movements as scene changes; slide presentations need lower thresholds (0.2-0.3) to catch every slide transition.

### Keyframe (I-Frame)

A keyframe (intra-coded frame, or I-frame) is a frame in the video's compressed encoding that contains a complete image, not a differential from a previous frame. Video codecs (H.264, H.265, VP9) encode most frames as differences from previous frames (P-frames and B-frames) to achieve compression. Periodically, the codec inserts a keyframe that can be decoded independently. Codecs place keyframes at scene changes, at regular intervals (typically every 2-10 seconds), and at the start of the video. Extracting keyframes is extremely fast (no inter-frame decoding needed) and produces frames that the codec itself considered significant -- a useful heuristic for visual importance.

### Perceptual Hash (pHash)

A perceptual hash is a compact fingerprint of an image that captures its visual structure rather than its exact pixel values. Two visually similar images produce similar perceptual hashes, even if they differ in resolution, compression, color balance, or minor details. `vidsnap-ai` uses perceptual hashing for two purposes: scene change detection (comparing hashes of consecutive frames) and deduplication (comparing hashes of selected frames to remove near-duplicates). The Hamming distance between two perceptual hashes measures their visual dissimilarity: a distance of 0 means identical images; a distance above a threshold means visually distinct images.

### Frame Deduplication

Frame deduplication is the process of removing near-identical frames from the set of selected frames. Even with smart sampling, some extracted frames may be visually redundant: a slow camera pan produces slightly different frames at each sample point; a zoom gradually changes the framing; a static scene with minor motion (a clock ticking, a cursor blinking) produces frames that are effectively identical from an information perspective. Deduplication compares each candidate frame against all previously selected frames using perceptual hashing. If a candidate is too similar to an already-selected frame (Hamming distance below the dedup threshold), it is discarded. This produces a minimal set of visually distinct frames.

### Token Budget

A token budget is the maximum number of vision tokens the caller is willing to spend on frames from a single video. Each frame sent to a vision LLM costs vision tokens -- the exact count depends on the provider, image dimensions, and detail mode. For OpenAI at high detail, a 1024x768 frame costs 765 tokens; at low detail, it costs 85 tokens. For Anthropic, it costs approximately 1,049 tokens. For Gemini, it costs a flat 258 tokens. Budget-aware sampling selects the number of frames that fits within the caller's token budget, prioritizing frames that maximize visual coverage (most different from each other).

### Video Metadata

Video metadata describes the technical properties of a video file: duration (in seconds), resolution (width and height in pixels), frame rate (frames per second), codec (H.264, H.265, VP9, AV1), total frame count, and file size in bytes. This information is extracted via `ffprobe` (the companion tool to `ffmpeg`) without decoding any frames. Video metadata informs sampling decisions: duration and frame rate determine how many total frames exist; resolution determines the token cost per frame; codec determines whether keyframe extraction is available.

---

## 5. Sampling Strategies

This section catalogs every sampling strategy, its algorithm, parameters, tradeoffs, and recommended use cases.

### 5.1 Fixed Interval (`interval`)

Extract one frame every N seconds, producing a predictable, evenly spaced set of frames.

**Algorithm:**

```
timestamps = []
t = 0
while t < duration:
  timestamps.push(t)
  t += intervalSeconds
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intervalSeconds` | `number` | `1.0` | Time between extracted frames, in seconds. |

**When to use:**
- When predictable, evenly spaced coverage is needed regardless of content.
- For videos with relatively uniform visual pace (e.g., continuous action footage, dashcam video).
- When scene change detection overhead is undesirable (very long videos where analysis time matters).

**Tradeoffs:**
- Simple and fast -- no inter-frame comparison needed.
- Wastes frames on static scenes (a 30-second title card produces 30 frames at 1-second interval, all identical).
- Misses rapid scene changes (a 0.5-second transition between two scenes may fall between sample points at 1-second interval).
- No content awareness -- treats all parts of the video equally.

**Example output -- 60-second video at 1-second interval:**

60 frames at timestamps 0.0, 1.0, 2.0, ..., 59.0 seconds.

**Example output -- 60-second video at 5-second interval:**

12 frames at timestamps 0.0, 5.0, 10.0, ..., 55.0 seconds.

### 5.2 Scene Change (`scene`)

Extract a frame at every detected scene change. Only captures frames where the visual content actually changes.

**Algorithm:**

```
sceneChanges = detectSceneChanges(video, threshold, algorithm)
frames = []
for each change in sceneChanges:
  frames.push(extractFrame(video, change.timestamp))
// Always include the first frame
if frames[0].timestamp > 0:
  frames.unshift(extractFrame(video, 0))
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | `number` | `0.3` | Scene change sensitivity (0.0-1.0). Lower detects more changes. |
| `algorithm` | `SceneAlgorithm` | `'histogram'` | Detection algorithm: `'histogram'`, `'pixel'`, `'phash'`, `'ssim'`. |
| `analyzeInterval` | `number` | `0.25` | Seconds between frames analyzed for scene changes. |

**When to use:**
- For videos with distinct visual segments separated by transitions (movies, TV shows, edited content).
- For slide-based presentations where content changes discretely.
- When minimizing frame count is the primary goal -- only extract what is visually new.

**Tradeoffs:**
- Produces the most informative frames per frame extracted -- every frame captures a visual transition.
- Computationally more expensive than interval sampling -- requires comparing consecutive frames.
- May miss gradual changes (slow dissolves, progressive zoom) if the threshold is too high.
- May produce too many frames for fast-paced content (music videos, action sequences) if the threshold is too low.
- Frame count is unpredictable -- depends entirely on video content.

**Example output -- 60-second lecture with 5 slide transitions:**

Approximately 6 frames: the opening frame plus one frame at each slide transition.

**Example output -- 60-second action movie trailer with rapid cuts:**

Approximately 30-60 frames: one frame per cut.

### 5.3 Keyframe (`keyframe`)

Extract the codec's I-frames (intra-coded frames) directly from the video stream without inter-frame decoding.

**Algorithm:**

```
iframes = extractIFrames(video)  // uses ffmpeg -skip_frame nokey
frames = []
for each iframe in iframes:
  frames.push(iframe)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxFrames` | `number` | `undefined` | Maximum number of keyframes to extract. If the video has more keyframes, select evenly spaced subset. |

**When to use:**
- When extraction speed is the top priority -- keyframe extraction is 5-10x faster than full decoding.
- For initial quick analysis before detailed sampling.
- When the video codec's keyframe placement is known to correlate with content changes (well-encoded content).

**Tradeoffs:**
- Fastest extraction method -- no inter-frame comparison, no full frame decoding.
- Keyframe placement is a codec decision, not a content decision. Codecs insert keyframes at regular intervals (every 2-10 seconds) regardless of whether the visual content changed. Some keyframes are placed at scene boundaries; many are not.
- Inconsistent density: different encoders, bitrate settings, and GOP (Group of Pictures) sizes produce different keyframe intervals. The same video re-encoded with different settings produces different keyframes.
- Not suitable when precise scene boundary capture is required.

**Example output -- 60-second H.264 video with 2-second GOP:**

Approximately 30 keyframes at ~2-second intervals.

### 5.4 Hybrid (`hybrid`) -- Default

Extract frames at fixed intervals, plus additional frames at detected scene changes. Combines the predictable coverage of interval sampling with the content awareness of scene change detection. This is the default strategy.

**Algorithm:**

```
// Start with interval-based frames
intervalFrames = sample(video, { strategy: 'interval', intervalSeconds })

// Add scene change frames
sceneChanges = detectSceneChanges(video, threshold, algorithm)
sceneFrames = sceneChanges.map(c => extractFrame(video, c.timestamp))

// Merge, deduplicate by proximity
allTimestamps = merge(intervalFrames, sceneFrames)
deduplicated = removeTimestampsCloserThan(allTimestamps, minGap)

// Extract final frames
frames = deduplicated.map(t => extractFrame(video, t))
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intervalSeconds` | `number` | `2.0` | Base interval between fixed-interval frames. |
| `threshold` | `number` | `0.3` | Scene change detection threshold. |
| `algorithm` | `SceneAlgorithm` | `'histogram'` | Scene change detection algorithm. |
| `minGap` | `number` | `0.5` | Minimum seconds between any two selected frames. Prevents clustering. |

**When to use:**
- As the default for general-purpose video analysis. Suitable for most video types.
- When both predictable coverage and content awareness are desired.
- When the caller does not know the video content in advance and needs a robust strategy.

**Tradeoffs:**
- Produces more frames than pure scene change detection (adds interval frames in static regions).
- Produces fewer redundant frames than pure interval sampling (deduplicates near-identical frames).
- Slightly more computation than interval-only (scene change detection adds overhead).
- Good all-around strategy but not optimal for any specific video type.

**Example output -- 60-second lecture with 5 slide transitions at 2-second base interval:**

Approximately 30 interval frames plus 5 scene change frames, deduplicated to approximately 32-34 frames.

### 5.5 Uniform Count (`uniform`)

Extract exactly N frames evenly spaced across the video's duration. The caller specifies the desired frame count, not the interval.

**Algorithm:**

```
interval = duration / count
timestamps = []
for i in 0..count-1:
  timestamps.push(i * interval)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | `number` | `10` | Exact number of frames to extract. |

**When to use:**
- When the caller needs a fixed number of frames regardless of video duration.
- For generating consistent-size frame sets for batch processing (e.g., "always extract 10 frames per video").
- When the downstream system expects a specific input size.

**Tradeoffs:**
- Predictable output size -- always exactly N frames.
- No content awareness -- treats all parts of the video equally.
- For short videos, N frames may be redundant; for long videos, N frames may miss important content.
- Simple to reason about cost: N frames * tokens_per_frame = total_tokens.

**Example output -- 60-second video with count=10:**

10 frames at timestamps 0.0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0, 48.0, 54.0.

### 5.6 Budget-Aware (`budget`)

Select frames that maximize visual coverage within a specified token budget. The sampler estimates the token cost per frame and selects the number of frames that fits within the budget, prioritizing frames that are most visually distinct from each other.

**Algorithm:**

```
// Estimate tokens per frame based on video resolution and target provider
tokensPerFrame = estimateTokensPerFrame(videoInfo, provider, detail)

// Calculate maximum frame count within budget
maxFrames = floor(tokenBudget / tokensPerFrame)

// Extract candidate frames at a dense interval
candidates = sample(video, { strategy: 'interval', intervalSeconds: 0.5 })

// Score candidates by visual distinctiveness
scores = computeDistinctivenessScores(candidates)

// Greedily select maxFrames candidates with highest scores
selected = greedySelect(candidates, scores, maxFrames)

// Sort by timestamp
selected.sort((a, b) => a.timestamp - b.timestamp)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tokenBudget` | `number` | required | Maximum total vision tokens for all frames. |
| `provider` | `Provider` | `'openai'` | Target provider for token cost estimation. |
| `detail` | `'low' \| 'high'` | `'high'` | OpenAI detail mode (affects tokens per frame). |

**When to use:**
- When the caller has a fixed token budget and wants to maximize the visual information extracted within that budget.
- For cost-controlled pipelines where each video must consume no more than N tokens.
- When integrating with `context-budget` for context window management.

**Tradeoffs:**
- Directly optimizes for the caller's cost constraint.
- Requires knowledge of the target provider and detail mode for accurate token estimation.
- Requires `vision-prep` for token estimation; without it, falls back to an approximate formula.
- The greedy selection algorithm is O(n*k) where n is the number of candidates and k is the number of selected frames -- fast enough for typical use but slower than simple interval sampling.

**Example output -- 60-second video, 5000 token budget, OpenAI high detail (765 tokens/frame):**

`floor(5000 / 765) = 6` frames, selected to maximize visual diversity across the video.

### 5.7 Custom (`custom`)

The caller provides a function that receives video metadata and returns the timestamps at which frames should be extracted.

**Algorithm:**

```
timestamps = customFunction(videoInfo)
frames = timestamps.map(t => extractFrame(video, t))
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `selector` | `FrameSelector` | required | Function that receives `VideoInfo` and returns `number[]` (timestamps in seconds). |

**When to use:**
- When the caller has domain-specific knowledge about which frames to extract (e.g., extract frames at specific event timestamps from a separate timeline).
- When integrating with external scene detection or event detection systems.
- When none of the built-in strategies fit the use case.

**Tradeoffs:**
- Maximum flexibility -- the caller controls all frame selection logic.
- The caller must handle all analysis themselves; `vidsnap-ai` only provides extraction and post-processing (deduplication, output formatting).
- The custom function receives video metadata but not frame data -- it specifies timestamps, not visual features.

**Example:**

```typescript
const frames = await sample('./lecture.mp4', {
  strategy: 'custom',
  selector: (info) => {
    // Extract frames at specific chapter timestamps
    return [0, 120, 300, 600, 900, 1200, info.duration - 1];
  },
});
```

---

## 6. Scene Change Detection

Scene change detection is the analysis of consecutive video frames to identify points where the visual content changes significantly. `vidsnap-ai` implements four detection algorithms, each with different accuracy, performance, and sensitivity characteristics.

### 6.1 Histogram Comparison

Compute a color histogram for each frame and compare consecutive frames using chi-squared distance. This is the default algorithm.

**How it works:**

1. Extract a frame at each analysis interval (default: every 0.25 seconds).
2. For each frame, compute a per-channel color histogram. Quantize each color channel (R, G, B) into 64 bins, producing a 192-element histogram vector.
3. For each pair of consecutive frames, compute the chi-squared distance between their histograms:

```
chi_squared = sum((h1[i] - h2[i])^2 / (h1[i] + h2[i] + epsilon)) for all bins i
```

4. Normalize the distance to the range [0.0, 1.0].
5. If the normalized distance exceeds the threshold, mark this point as a scene change.

**Characteristics:**
- **Accuracy**: Good for detecting hard cuts and significant content changes. Less sensitive to camera motion and lighting gradients than pixel difference.
- **Speed**: Fast. Histogram computation is O(pixels), comparison is O(bins). Approximately 2-5 ms per frame pair on a modern machine.
- **Robustness**: Tolerant of small camera movements, minor lighting changes, and object motion within a static scene. These produce small histogram shifts that stay below reasonable thresholds.
- **Weakness**: Struggles with flash frames (sudden brightness spike followed by return to normal), cross-dissolves (gradual histogram shift may stay below threshold at each step), and scenes with similar color distributions but different spatial layouts.

**Recommended threshold:** 0.3 for general use; 0.2 for presentations with subtle slide transitions; 0.5 for noisy video with frequent minor changes.

### 6.2 Pixel Difference

Compute the mean absolute difference between pixel values of consecutive frames. The simplest and fastest algorithm.

**How it works:**

1. Extract a frame at each analysis interval.
2. Resize both frames to a standard comparison resolution (default: 320x240) to reduce computation and normalize across video resolutions.
3. Compute the mean absolute difference across all pixel channels:

```
diff = mean(abs(frame1[x,y,c] - frame2[x,y,c])) for all x, y, c
```

4. Normalize to [0.0, 1.0] by dividing by 255.
5. If the normalized difference exceeds the threshold, mark as a scene change.

**Characteristics:**
- **Accuracy**: Moderate. Detects dramatic visual changes (hard cuts) reliably. Overly sensitive to camera motion, lighting changes, and objects moving across the frame -- these produce large pixel differences even without scene changes.
- **Speed**: Fastest algorithm. Simple arithmetic on pixel arrays. Approximately 1-3 ms per frame pair.
- **Robustness**: Low. Camera shake, slow pans, and gradual lighting changes produce false positives. Works best on static-camera footage.
- **Weakness**: Cannot distinguish between "the camera moved slightly" and "the scene changed entirely" -- both produce large pixel differences. Poorly suited for handheld or moving-camera footage.

**Recommended threshold:** 0.15 for static-camera footage (surveillance, presentations); 0.3-0.5 for moving-camera footage (with many false positives expected).

### 6.3 Perceptual Hash (pHash)

Compute a perceptual hash for each frame and compare consecutive frames using Hamming distance. Captures structural visual similarity rather than pixel-level differences.

**How it works:**

1. Extract a frame at each analysis interval.
2. For each frame, compute a 64-bit perceptual hash:
   a. Resize to 32x32 grayscale.
   b. Apply a discrete cosine transform (DCT) to the 32x32 image.
   c. Take the top-left 8x8 DCT coefficients (low-frequency components).
   d. Compute the median of these 64 coefficients.
   e. Set each bit of the hash: 1 if the coefficient exceeds the median, 0 otherwise.
3. For each pair of consecutive frames, compute the Hamming distance between their hashes (number of differing bits).
4. Normalize to [0.0, 1.0] by dividing by 64.
5. If the normalized distance exceeds the threshold, mark as a scene change.

**Characteristics:**
- **Accuracy**: Good for detecting structural content changes. Ignores minor variations in brightness, contrast, and compression artifacts. Captures the "shape" of the visual content rather than exact pixel values.
- **Speed**: Moderate. DCT computation is O(n^2) on the 32x32 image, but the images are small. Approximately 3-8 ms per frame pair.
- **Robustness**: High. Tolerant of JPEG compression artifacts, minor color shifts, brightness changes, and small geometric distortions. Good for comparing frames from different compression levels or slight camera jitter.
- **Weakness**: The 64-bit hash has limited resolution -- subtle but meaningful changes (a small text difference on a slide) may not change enough hash bits to exceed the threshold. Very aggressive quantization may miss fine-grained content changes.

**Recommended threshold:** 0.2 for general use; 0.15 for catching subtle changes; 0.3 for ignoring minor variations.

### 6.4 Structural Similarity (SSIM)

Compute the Structural Similarity Index between consecutive frames. SSIM measures perceived visual quality by comparing luminance, contrast, and structure patterns.

**How it works:**

1. Extract a frame at each analysis interval.
2. Resize both frames to a standard comparison resolution (default: 320x240).
3. Convert to grayscale.
4. Compute SSIM between the two frames:

```
SSIM(x, y) = (2*mu_x*mu_y + C1)(2*sigma_xy + C2) / ((mu_x^2 + mu_y^2 + C1)(sigma_x^2 + sigma_y^2 + C2))
```

Where `mu` is the mean, `sigma` is the standard deviation, `sigma_xy` is the covariance, and `C1`, `C2` are stability constants.

5. SSIM returns a value in [0.0, 1.0] where 1.0 means identical. Convert to a change score: `change = 1.0 - SSIM`.
6. If the change score exceeds the threshold, mark as a scene change.

**Characteristics:**
- **Accuracy**: Highest perceptual accuracy among the four algorithms. SSIM was designed to match human perception of visual difference. Detects changes that a human viewer would notice while ignoring changes that are imperceptible.
- **Speed**: Slowest algorithm. SSIM computation involves local statistics (mean, variance, covariance) computed over sliding windows. Approximately 10-20 ms per frame pair at 320x240 resolution.
- **Robustness**: Very high. Designed to be robust against uniform brightness and contrast changes. Focuses on structural patterns that matter for perception.
- **Weakness**: Computationally expensive. For long videos at fine analysis intervals, SSIM can become a bottleneck. Use a coarser analysis interval (0.5-1.0 seconds) for long videos.

**Recommended threshold:** 0.25 for general use; 0.15 for high-sensitivity detection; 0.4 for detecting only major changes.

### 6.5 Multi-Algorithm Consensus

For maximum robustness, the caller can configure multiple algorithms. A scene change is only detected when a configurable number of algorithms agree.

**Configuration:**

```typescript
const scenes = await detectScenes('./video.mp4', {
  algorithms: ['histogram', 'phash', 'ssim'],
  consensus: 2,  // at least 2 of 3 must agree
  threshold: 0.3,
});
```

**How it works:**

1. Run each configured algorithm independently on the same frame pairs.
2. For each frame pair, count how many algorithms report a scene change.
3. If the count meets or exceeds the `consensus` threshold, report a scene change.

This reduces false positives from any single algorithm. For example, pixel difference may flag camera shake as a scene change, but histogram comparison and SSIM will correctly identify it as the same scene -- producing a 1-of-3 vote that falls below a consensus of 2.

### 6.6 Algorithm Comparison

| Algorithm | Speed | Accuracy | Best For |
|-----------|-------|----------|----------|
| `histogram` | Fast (~3 ms/pair) | Good | General use, hard cuts, slide transitions |
| `pixel` | Fastest (~2 ms/pair) | Moderate | Static camera, surveillance, simple content |
| `phash` | Moderate (~5 ms/pair) | Good | Structurally different scenes, compression-heavy video |
| `ssim` | Slow (~15 ms/pair) | Highest | Perceptually accurate detection, quality-sensitive analysis |

---

## 7. Frame Deduplication

### Why Deduplication Matters

Even with smart sampling strategies, the selected frames may contain near-duplicates. Common scenarios:

- **Slow pans**: The camera moves slowly across a scene. Consecutive sampled frames show slightly different views of the same content. Each frame is individually selected by the strategy (it differs from its immediate predecessor by more than the scene change threshold), but the overall set contains redundant information.
- **Gradual zooms**: A zoom changes the framing gradually. Each step differs from the previous one, but frames from the beginning and middle of the zoom may be visually similar enough to be redundant.
- **Static presentations with minor motion**: A slide presentation with an animated cursor or progress bar. Each frame differs slightly (the cursor moved), but the informational content is the same.
- **Looping content**: A video that loops or revisits the same visual content. Frames from different timestamps may show identical visual content.

### How Deduplication Works

After the sampling strategy selects candidate frames, deduplication removes near-duplicates:

```
selected = []
for each candidate in candidates:
  if selected is empty:
    selected.push(candidate)
    continue

  isDuplicate = false
  for each existing in selected:
    similarity = computePHashSimilarity(candidate, existing)
    if similarity > dedupThreshold:  // too similar
      isDuplicate = true
      break

  if not isDuplicate:
    selected.push(candidate)
```

### Deduplication Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dedup` | `boolean` | `true` | Enable/disable deduplication. |
| `dedupThreshold` | `number` | `0.9` | Similarity threshold (0.0-1.0). Frames with pHash similarity above this value are considered duplicates. Higher value = more aggressive deduplication. |

### Similarity Metric

Deduplication uses perceptual hash (pHash) similarity:

```
similarity = 1.0 - (hammingDistance(hash1, hash2) / 64)
```

A similarity of 1.0 means identical hashes (identical images). A similarity of 0.5 means 32 of 64 bits differ (very different images). The default threshold of 0.9 removes frames that are nearly identical (fewer than 7 bits differ).

### Deduplication Behavior

- **First frame is always kept.** The deduplication process iterates in timestamp order, keeping the first occurrence of each visually distinct frame.
- **Comparison is against all selected frames**, not just the immediately preceding one. This catches visually identical frames from different parts of the video (e.g., a video that returns to the same location).
- **Deduplication runs after strategy selection**, not during. The strategy selects candidates based on its own criteria; deduplication is a post-processing step.
- **Deduplication can be disabled** (`dedup: false`) when the caller wants all strategy-selected frames regardless of visual similarity.

---

## 8. Token Budget Mode

### Overview

Token budget mode selects frames that maximize visual coverage within a specified token budget. The caller specifies the total tokens they are willing to spend on frames from this video, and `vidsnap-ai` determines how many frames to extract and which frames to select to maximize the diversity of visual information within that budget.

### Token Estimation

The token cost per frame depends on the frame's dimensions and the target provider. When `vision-prep` is available, `vidsnap-ai` uses its `estimateTokens()` function for exact per-provider calculations. When `vision-prep` is not available, `vidsnap-ai` uses conservative built-in estimates:

| Provider | Detail | Estimated Tokens per Frame |
|----------|--------|---------------------------|
| OpenAI | `low` | 85 |
| OpenAI | `high` | 765 (assumes 2x2 tiling at 1024x768 or similar) |
| Anthropic | -- | 1,049 (assumes 1024x768) |
| Gemini | -- | 258 (flat rate) |

When video resolution is known, the estimate is adjusted. A 1920x1080 video sent to OpenAI at high detail produces frames that cost 1,105 tokens each after provider resizing.

### Frame Selection Algorithm

Budget-aware sampling uses a greedy diversity-maximization algorithm:

```
maxFrames = floor(tokenBudget / tokensPerFrame)

// Extract dense candidate frames
candidates = extractFramesAtInterval(video, 0.5)  // every 0.5 seconds

// Compute pHash for all candidates
hashes = candidates.map(computePHash)

// Greedy selection: pick the frame most different from all already-selected frames
selected = [candidates[0]]  // always start with the first frame
selectedHashes = [hashes[0]]

while selected.length < maxFrames:
  bestCandidate = null
  bestMinDistance = -1

  for each candidate, hash in zip(candidates, hashes):
    if candidate already selected: continue
    // Minimum distance to any selected frame
    minDist = min(hammingDistance(hash, sh) for sh in selectedHashes)
    if minDist > bestMinDistance:
      bestMinDistance = minDist
      bestCandidate = candidate
      bestHash = hash

  if bestCandidate is null: break
  selected.push(bestCandidate)
  selectedHashes.push(bestHash)

// Sort by timestamp for chronological order
selected.sort((a, b) => a.timestamp - b.timestamp)
```

This greedy farthest-point algorithm ensures that each selected frame is as visually different as possible from all previously selected frames, maximizing the diversity of the frame set.

### Budget Reporting

The `sample()` return value in budget mode includes budget information:

```typescript
const result = await sample('./video.mp4', {
  strategy: 'budget',
  tokenBudget: 5000,
  provider: 'openai',
  detail: 'high',
});

// result.frames: SampledFrame[]
// result.meta.tokenBudget: 5000
// result.meta.estimatedTokensUsed: 4590
// result.meta.tokensPerFrame: 765
// result.meta.framesSelected: 6
// result.meta.candidatesEvaluated: 120
```

---

## 9. Video Metadata

### What is Extracted

The `getVideoInfo()` function extracts technical metadata about a video file without decoding frames. It uses `ffprobe` (the companion tool to `ffmpeg`) to read the video container and stream headers.

```typescript
interface VideoInfo {
  /** Absolute path to the video file. */
  path: string;

  /** Video duration in seconds. */
  duration: number;

  /** Video width in pixels. */
  width: number;

  /** Video height in pixels. */
  height: number;

  /** Frame rate in frames per second (e.g., 29.97, 30, 60). */
  fps: number;

  /** Video codec name (e.g., 'h264', 'hevc', 'vp9', 'av1'). */
  codec: string;

  /** Total number of frames in the video (duration * fps, rounded). */
  totalFrames: number;

  /** File size in bytes. */
  fileSize: number;

  /** Video bitrate in bits per second. */
  bitrate: number;

  /** Whether the video has an audio stream. */
  hasAudio: boolean;

  /** Video container format (e.g., 'mp4', 'webm', 'mkv', 'avi'). */
  format: string;
}
```

### How Metadata Informs Sampling

Video metadata influences sampling decisions:

- **Duration** determines total candidate frame count and interval spacing.
- **Resolution** (width x height) determines token cost per frame. A 4K video (3840x2160) costs more tokens per frame than 720p (1280x720) because the frame is larger even after provider-specific resizing.
- **Frame rate** determines the minimum achievable interval. At 30 fps, frames are 33 ms apart; requesting frames at 10 ms intervals would produce duplicate frames.
- **Codec** determines whether keyframe extraction is available and how keyframes are distributed.
- **File size** and **bitrate** affect processing speed for full-decode strategies.

---

## 10. API Surface

### Installation

```bash
npm install vidsnap-ai
```

### System Dependencies

`ffmpeg` and `ffprobe` must be installed on the system. `vidsnap-ai` invokes them via `fluent-ffmpeg`. The package verifies their availability at startup and throws a `FfmpegNotFoundError` with installation instructions if they are not found.

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "sharp": ">=0.33.0"
  },
  "peerDependenciesMeta": {
    "sharp": { "optional": true }
  }
}
```

`sharp` is used for image comparison (histograms, pixel differencing, perceptual hashing, SSIM), frame resizing, and output encoding. It is a peer dependency to allow the caller to control the version. When `sharp` is not available, `vidsnap-ai` falls back to a reduced feature set: only `interval`, `uniform`, `keyframe`, and `custom` strategies are available (no scene change detection or deduplication, as these require image comparison). Frames are returned as raw JPEG Buffers from `ffmpeg` without further processing.

### Optional Dependencies

```json
{
  "optionalDependencies": {
    "vision-prep": "^0.1.0"
  }
}
```

`vision-prep` enables provider-specific frame optimization: resizing to optimal dimensions, token cost estimation, and content block formatting. When installed, `SampledFrame` objects include `tokens`, `cost`, and `contentBlock` fields. When absent, frames are returned as raw Buffers without token metadata.

### `sample`

The primary function. Extracts representative frames from a video using the configured sampling strategy.

```typescript
import { sample } from 'vidsnap-ai';

const result = await sample('./lecture.mp4', {
  strategy: 'hybrid',
  maxFrames: 20,
  dedup: true,
});

for (const frame of result.frames) {
  console.log(`Frame ${frame.index}: ${frame.timestamp.toFixed(1)}s`);
  // frame.buffer is a Buffer containing the frame image (JPEG)
  // frame.base64 is the base64-encoded image (if outputBase64: true)
}
```

**Signature:**

```typescript
function sample(
  video: VideoSource,
  options?: SampleOptions,
): Promise<SampleResult>;
```

### `sampleStream`

Streaming extraction. Returns an `AsyncIterable` that yields frames as they are extracted. Essential for long videos where loading all frames into memory at once is impractical.

```typescript
import { sampleStream } from 'vidsnap-ai';

for await (const frame of sampleStream('./long-video.mp4', {
  strategy: 'scene',
  threshold: 0.3,
})) {
  console.log(`Frame at ${frame.timestamp.toFixed(1)}s (scene change: ${frame.sceneChangeScore?.toFixed(2)})`);
  await processFrame(frame.buffer);
}
```

**Signature:**

```typescript
function sampleStream(
  video: VideoSource,
  options?: SampleOptions,
): AsyncIterable<SampledFrame>;
```

### `detectScenes`

Analyzes a video for scene changes without extracting full-resolution frames. Returns scene change timestamps and magnitude scores. Useful for analysis, visualization, or when the caller wants to implement custom frame selection logic.

```typescript
import { detectScenes } from 'vidsnap-ai';

const scenes = await detectScenes('./movie-clip.mp4', {
  algorithm: 'histogram',
  threshold: 0.3,
});

for (const scene of scenes) {
  console.log(`Scene change at ${scene.timestamp.toFixed(2)}s (score: ${scene.score.toFixed(3)})`);
}
```

**Signature:**

```typescript
function detectScenes(
  video: VideoSource,
  options?: SceneDetectOptions,
): Promise<SceneChange[]>;
```

### `getVideoInfo`

Extracts video metadata without decoding frames. Uses `ffprobe`.

```typescript
import { getVideoInfo } from 'vidsnap-ai';

const info = await getVideoInfo('./video.mp4');
console.log(`${info.duration}s, ${info.width}x${info.height}, ${info.fps} fps, ${info.codec}`);
```

**Signature:**

```typescript
function getVideoInfo(
  video: VideoSource,
): Promise<VideoInfo>;
```

### `createSampler`

Factory function that returns a pre-configured `VideoSampler` instance. Useful when sampling multiple videos with the same parameters.

```typescript
import { createSampler } from 'vidsnap-ai';

const sampler = createSampler({
  strategy: 'hybrid',
  maxFrames: 15,
  dedup: true,
  outputBase64: true,
  provider: 'openai',
  detail: 'high',
});

const result1 = await sampler.sample('./video1.mp4');
const result2 = await sampler.sample('./video2.mp4');
```

**Signature:**

```typescript
function createSampler(config: SamplerConfig): VideoSampler;

interface VideoSampler {
  sample(video: VideoSource, options?: Partial<SampleOptions>): Promise<SampleResult>;
  sampleStream(video: VideoSource, options?: Partial<SampleOptions>): AsyncIterable<SampledFrame>;
  detectScenes(video: VideoSource, options?: Partial<SceneDetectOptions>): Promise<SceneChange[]>;
  getVideoInfo(video: VideoSource): Promise<VideoInfo>;
}
```

### Type Definitions

```typescript
// ── Source ───────────────────────────────────────────────────────────

/** Video input: file path or Buffer. */
type VideoSource = string | Buffer;

// ── Sampling Strategy ───────────────────────────────────────────────

/** Available sampling strategies. */
type SamplingStrategy =
  | 'interval'
  | 'scene'
  | 'keyframe'
  | 'hybrid'
  | 'uniform'
  | 'budget'
  | 'custom';

/** Scene change detection algorithms. */
type SceneAlgorithm = 'histogram' | 'pixel' | 'phash' | 'ssim';

/** Custom frame selector function. */
type FrameSelector = (info: VideoInfo) => number[] | Promise<number[]>;

// ── Options ─────────────────────────────────────────────────────────

interface SampleOptions {
  /** Sampling strategy. Default: 'hybrid'. */
  strategy?: SamplingStrategy;

  /** Maximum number of frames to return. Applies to all strategies as a
   *  ceiling. Default: 50. */
  maxFrames?: number;

  /** Minimum number of frames to return. If the strategy produces fewer,
   *  pad with uniformly spaced frames. Default: 1. */
  minFrames?: number;

  // ── Interval strategy options ──

  /** Seconds between frames for 'interval' and 'hybrid' strategies.
   *  Default: 1.0 for 'interval', 2.0 for 'hybrid'. */
  intervalSeconds?: number;

  // ── Scene change options ──

  /** Scene change detection threshold (0.0-1.0). Lower = more sensitive.
   *  Default: 0.3. */
  threshold?: number;

  /** Scene change detection algorithm. Default: 'histogram'. */
  algorithm?: SceneAlgorithm;

  /** Multiple algorithms for consensus-based detection. Overrides
   *  'algorithm' when specified. */
  algorithms?: SceneAlgorithm[];

  /** Minimum number of algorithms that must agree for consensus mode.
   *  Default: 2. */
  consensus?: number;

  /** Seconds between frames analyzed for scene changes. Smaller values
   *  increase accuracy but cost more processing time.
   *  Default: 0.25. */
  analyzeInterval?: number;

  // ── Hybrid strategy options ──

  /** Minimum seconds between any two frames in hybrid mode. Prevents
   *  clustering of interval + scene change frames. Default: 0.5. */
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

  /** Dedup similarity threshold (0.0-1.0). Frames with pHash similarity
   *  above this are considered duplicates. Default: 0.9. */
  dedupThreshold?: number;

  // ── Output options ──

  /** Output image format for extracted frames. Default: 'jpeg'. */
  outputFormat?: 'jpeg' | 'png';

  /** JPEG quality (1-100). Default: 85. */
  quality?: number;

  /** Include base64-encoded image in each frame. Default: false. */
  outputBase64?: boolean;

  /** Resize frames to specific dimensions. When vision-prep is available,
   *  this is handled by the provider-specific resize logic. */
  maxWidth?: number;
  maxHeight?: number;

  /** Prepare frames for a specific provider using vision-prep. Requires
   *  vision-prep to be installed. Populates tokens, cost, and
   *  contentBlock fields on each SampledFrame. */
  prepareForProvider?: 'openai' | 'anthropic' | 'gemini';

  /** Model identifier for cost estimation (e.g., 'gpt-4o'). Requires
   *  vision-prep and model-price-registry. */
  model?: string;

  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

interface SceneDetectOptions {
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

interface SamplerConfig extends SampleOptions {
  // All SampleOptions fields serve as defaults for every sample() call.
  // Per-call options override these defaults.
}

// ── Results ─────────────────────────────────────────────────────────

interface SampleResult {
  /** Extracted frames in timestamp order. */
  frames: SampledFrame[];

  /** Video metadata. */
  video: VideoInfo;

  /** Sampling metadata. */
  meta: SampleMeta;
}

interface SampleMeta {
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

interface SampledFrame {
  /** Frame image data as a Buffer. */
  buffer: Buffer;

  /** Base64-encoded frame image. Only populated when
   *  outputBase64 is true. */
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

  /** Scene change score at this frame (0.0-1.0). Present when the frame
   *  was selected due to a scene change. Higher = more dramatic change. */
  sceneChangeScore?: number;

  /** Perceptual hash similarity to the previous selected frame (0.0-1.0).
   *  1.0 = identical, 0.0 = completely different. */
  similarity?: number;

  /** Whether this frame was selected as a scene change boundary. */
  isSceneChange: boolean;

  /** Estimated vision token count for this frame. Requires vision-prep. */
  tokens?: number;

  /** Estimated cost in USD for this frame. Requires vision-prep and
   *  model-price-registry. */
  cost?: number;

  /** Provider-formatted content block for this frame. Requires
   *  vision-prep. Ready to embed in a messages array. */
  contentBlock?: Record<string, unknown>;
}

interface SceneChange {
  /** Timestamp of the scene change in seconds. */
  timestamp: number;

  /** Scene change magnitude (0.0-1.0). Higher = more dramatic change. */
  score: number;

  /** Which algorithm detected this scene change. */
  algorithm: SceneAlgorithm;

  /** Frame index in the analysis sequence. */
  frameIndex: number;
}

interface VideoInfo {
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
```

### Type Exports

```typescript
export type {
  VideoSource,
  SamplingStrategy,
  SceneAlgorithm,
  FrameSelector,
  SampleOptions,
  SceneDetectOptions,
  SamplerConfig,
  SampleResult,
  SampleMeta,
  SampledFrame,
  SceneChange,
  VideoInfo,
  VideoSampler,
};
```

---

## 11. Output Preparation

### Raw Buffer Output (Default)

By default, `vidsnap-ai` returns each frame as a JPEG Buffer extracted by `ffmpeg`. The frame is at the video's native resolution (or resized if `maxWidth`/`maxHeight` are specified). No base64 encoding or provider formatting is applied.

```typescript
const result = await sample('./video.mp4');
const frame = result.frames[0];
// frame.buffer: Buffer (raw JPEG image data)
// frame.mimeType: 'image/jpeg'
// frame.width: 1920 (video native width)
// frame.height: 1080 (video native height)
```

### Base64 Output

When `outputBase64: true`, each frame includes a base64-encoded string of its image data. The base64 string does not include the data URL prefix.

```typescript
const result = await sample('./video.mp4', { outputBase64: true });
const frame = result.frames[0];
// frame.base64: '/9j/4AAQ...' (raw base64, no data: prefix)
```

### Provider-Formatted Output (via vision-prep)

When `prepareForProvider` is specified and `vision-prep` is installed, each frame is processed through `vision-prep`'s preparation pipeline: resized to the provider's optimal dimensions, compressed, base64-encoded, and formatted as a provider-specific content block.

```typescript
const result = await sample('./video.mp4', {
  prepareForProvider: 'openai',
  detail: 'high',
  model: 'gpt-4o',
});

const frame = result.frames[0];
// frame.tokens: 765
// frame.cost: 0.001913
// frame.contentBlock: { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...', detail: 'high' } }

// Ready to embed in an OpenAI messages array:
const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What happens in this video?' },
      ...result.frames.map(f => f.contentBlock),
    ],
  },
];
```

### Anthropic Content Block Format

```typescript
const result = await sample('./video.mp4', { prepareForProvider: 'anthropic' });

// frame.contentBlock:
// {
//   type: 'image',
//   source: { type: 'base64', media_type: 'image/jpeg', data: '/9j/4AAQ...' }
// }
```

### Gemini Content Block Format

```typescript
const result = await sample('./video.mp4', { prepareForProvider: 'gemini' });

// frame.contentBlock:
// {
//   inlineData: { mimeType: 'image/jpeg', data: '/9j/4AAQ...' }
// }
```

### Batch Provider Formatting

When preparing frames for a provider, aggregate statistics are included in the result metadata:

```typescript
const result = await sample('./video.mp4', {
  strategy: 'hybrid',
  maxFrames: 15,
  prepareForProvider: 'openai',
  detail: 'high',
  model: 'gpt-4o',
});

console.log(`Frames: ${result.frames.length}`);
console.log(`Total tokens: ${result.meta.estimatedTokensUsed}`);
// 15 frames * 765 tokens = 11,475 tokens
// Total cost: 15 * $0.001913 = $0.028695
```

---

## 12. Configuration

### Default Values

| Option | Default | Description |
|--------|---------|-------------|
| `strategy` | `'hybrid'` | Sampling strategy. |
| `maxFrames` | `50` | Maximum frames returned. |
| `minFrames` | `1` | Minimum frames returned. |
| `intervalSeconds` | `1.0` (interval) / `2.0` (hybrid) | Seconds between interval-based frames. |
| `threshold` | `0.3` | Scene change detection threshold. |
| `algorithm` | `'histogram'` | Scene change detection algorithm. |
| `analyzeInterval` | `0.25` | Seconds between frames analyzed for scene changes. |
| `minGap` | `0.5` | Minimum gap between selected frames in hybrid mode. |
| `count` | `10` | Frame count for uniform strategy. |
| `dedup` | `true` | Enable frame deduplication. |
| `dedupThreshold` | `0.9` | Deduplication similarity threshold. |
| `outputFormat` | `'jpeg'` | Output image format. |
| `quality` | `85` | JPEG quality. |
| `outputBase64` | `false` | Include base64 in output. |
| `provider` | `'openai'` | Provider for budget/token estimation. |
| `detail` | `'high'` | OpenAI detail mode. |
| `consensus` | `2` | Algorithms that must agree in consensus mode. |

### Recommended Configurations by Video Type

| Video Type | Strategy | Key Options |
|------------|----------|-------------|
| Lecture/presentation | `scene` | `threshold: 0.2, algorithm: 'histogram'` |
| Surveillance footage | `scene` | `threshold: 0.3, algorithm: 'pixel'` |
| Movie/TV clip | `hybrid` | `intervalSeconds: 3, threshold: 0.3` |
| Short social media clip | `uniform` | `count: 8` |
| Long documentary | `budget` | `tokenBudget: 10000, provider: 'openai'` |
| Quick preview | `keyframe` | `maxFrames: 10` |

### No Configuration Files

`vidsnap-ai` has no configuration files, environment variables, or initialization steps. Import and call:

```typescript
import { sample } from 'vidsnap-ai';
const result = await sample('./video.mp4');
```

All behavior is controlled via function parameters.

---

## 13. CLI

### Installation and Invocation

```bash
# Global install
npm install -g vidsnap-ai
vidsnap-ai sample ./video.mp4

# npx (no install)
npx vidsnap-ai sample ./video.mp4 --output-dir ./frames

# Package script
# package.json: { "scripts": { "extract-frames": "vidsnap-ai sample ./videos/*.mp4" } }
```

### CLI Binary Name

`vidsnap-ai`

### Commands

#### `vidsnap-ai sample <video> [options]`

Extracts representative frames from a video.

```
Arguments:
  <video>                    Path to the video file.

Strategy options:
  --strategy <name>          Sampling strategy: interval, scene, keyframe,
                             hybrid, uniform, budget. Default: hybrid.
  --max-frames <n>           Maximum number of frames. Default: 50.
  --interval <seconds>       Interval between frames (interval/hybrid).
                             Default: 1.0.
  --threshold <n>            Scene change threshold (0.0-1.0). Default: 0.3.
  --algorithm <name>         Scene detection algorithm: histogram, pixel,
                             phash, ssim. Default: histogram.
  --count <n>                Frame count for uniform strategy. Default: 10.
  --token-budget <n>         Token budget for budget strategy.
  --provider <name>          Provider for token estimation: openai, anthropic,
                             gemini. Default: openai.
  --detail <mode>            OpenAI detail mode: low, high. Default: high.

Deduplication:
  --no-dedup                 Disable frame deduplication.
  --dedup-threshold <n>      Dedup similarity threshold (0.0-1.0).
                             Default: 0.9.

Output options:
  --output-dir <path>        Write frames as image files to this directory.
                             Created if it does not exist. Default: ./frames.
  --format <fmt>             Output format: jpeg, png. Default: jpeg.
  --quality <n>              JPEG quality (1-100). Default: 85.
  --json                     Output frame metadata as JSON to stdout.
  --base64                   Include base64 data in JSON output.

General:
  --version                  Print version and exit.
  --help                     Print help and exit.
```

#### `vidsnap-ai scenes <video> [options]`

Detects scene changes in a video.

```
Arguments:
  <video>                    Path to the video file.

Options:
  --algorithm <name>         Detection algorithm. Default: histogram.
  --threshold <n>            Detection threshold (0.0-1.0). Default: 0.3.
  --analyze-interval <sec>   Seconds between analyzed frames. Default: 0.25.
  --format <fmt>             Output format: json, text. Default: text.

General:
  --version                  Print version and exit.
  --help                     Print help and exit.
```

#### `vidsnap-ai info <video>`

Prints video metadata.

```
Arguments:
  <video>                    Path to the video file.

Options:
  --json                     Output as JSON.

General:
  --version                  Print version and exit.
  --help                     Print help and exit.
```

### Human-Readable Output Examples

```
$ vidsnap-ai sample ./lecture.mp4 --strategy scene --threshold 0.2

  vidsnap-ai v0.1.0

  Video:     lecture.mp4 (45:12, 1920x1080, 30 fps, h264)
  Strategy:  scene (threshold: 0.2, algorithm: histogram)
  Dedup:     enabled (threshold: 0.9)

  Detecting scene changes... 28 changes found
  Extracting frames...
  Deduplicating... removed 3 near-duplicates

  Frame  0:   0:00.0  (first frame)
  Frame  1:   1:23.4  (scene change, score: 0.47)
  Frame  2:   3:05.1  (scene change, score: 0.62)
  ...
  Frame 24:  44:51.2  (scene change, score: 0.38)

  25 frames written to ./frames/
  Processing time: 4.2s
```

```
$ vidsnap-ai scenes ./movie-clip.mp4

  vidsnap-ai v0.1.0

  Video: movie-clip.mp4 (2:34, 1920x1080, 24 fps, h264)

  Scene changes (histogram, threshold: 0.3):

    0:03.25  score: 0.482
    0:07.50  score: 0.351
    0:15.00  score: 0.891
    0:22.75  score: 0.445
    ...

  18 scene changes detected
```

```
$ vidsnap-ai info ./video.mp4 --json

{
  "path": "/absolute/path/to/video.mp4",
  "duration": 125.4,
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "codec": "h264",
  "totalFrames": 3762,
  "fileSize": 52428800,
  "bitrate": 3345408,
  "hasAudio": true,
  "format": "mp4"
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success. Frames extracted or metadata printed. |
| `1` | Processing error. Video could not be read, decoded, or processed. |
| `2` | Configuration error. Invalid flags, missing arguments, unsupported format. |

---

## 14. Integration with Monorepo Packages

### Integration with `vision-prep`

`vision-prep` prepares images for vision LLM APIs -- resizing to provider-optimal dimensions, compressing, base64 encoding, and estimating token costs. `vidsnap-ai` produces frames (images); `vision-prep` optimizes them for a specific provider. When both packages are installed, `vidsnap-ai` passes each extracted frame through `vision-prep`'s `prepare()` function.

```typescript
import { sample } from 'vidsnap-ai';

// With vision-prep installed, frames are automatically prepared
const result = await sample('./video.mp4', {
  strategy: 'hybrid',
  maxFrames: 10,
  prepareForProvider: 'openai',
  detail: 'high',
  model: 'gpt-4o',
});

// Each frame has token count, cost, and a ready-to-use content block
for (const frame of result.frames) {
  console.log(`Frame at ${frame.timestamp}s: ${frame.tokens} tokens, $${frame.cost}`);
  // frame.contentBlock is ready for the OpenAI messages array
}
```

### Integration with `multimodal-msg`

`multimodal-msg` constructs structured multimodal message arrays for LLM APIs. `vidsnap-ai`'s frames, when prepared for a provider, produce content blocks that can be directly embedded in the message arrays that `multimodal-msg` constructs.

```typescript
import { sample } from 'vidsnap-ai';
import { buildMessage } from 'multimodal-msg';

const result = await sample('./video.mp4', {
  prepareForProvider: 'openai',
  maxFrames: 10,
});

const message = buildMessage({
  text: 'Describe what happens in this video.',
  images: result.frames.map(f => f.contentBlock),
});
```

### Integration with `prompt-price`

`prompt-price` estimates the total cost of an LLM request including text and image tokens. `vidsnap-ai`'s per-frame token estimates feed into `prompt-price`'s total cost calculation. The combined estimate tells the caller exactly how much a video analysis request will cost.

```typescript
import { sample } from 'vidsnap-ai';
import { estimate } from 'prompt-price';

const result = await sample('./video.mp4', {
  prepareForProvider: 'openai',
  detail: 'high',
  maxFrames: 15,
});

const totalImageTokens = result.frames.reduce((sum, f) => sum + (f.tokens ?? 0), 0);
console.log(`Image tokens: ${totalImageTokens}`);
console.log(`Estimated image cost: $${(totalImageTokens / 1_000_000 * 2.50).toFixed(4)}`);
```

### Integration with `audio-chunker`

For complete video understanding, the audio track can be processed separately. `audio-chunker` splits the video's audio into transcription-ready chunks, while `vidsnap-ai` extracts representative frames. The combination provides both visual and auditory understanding of the video.

```typescript
import { sample } from 'vidsnap-ai';
import { chunk } from 'audio-chunker';

// Extract audio and video information in parallel
const [frames, audioChunks] = await Promise.all([
  sample('./video.mp4', { strategy: 'hybrid', maxFrames: 20 }),
  chunk('./video.mp4', { maxFileSize: '25mb', outputFormat: 'wav' }),
]);

// Transcribe audio
const transcription = await transcribeChunks(audioChunks);

// Analyze video with both visual and textual context
const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: `Video transcript: ${transcription}\n\nDescribe what happens in this video.` },
      ...frames.frames.map(f => f.contentBlock),
    ],
  },
];
```

---

## 15. Testing Strategy

### Unit Tests

**Video metadata extraction tests:**
- Extract metadata from a known test video and verify duration, resolution, fps, codec, and file size.
- Handle missing video file gracefully (throw `VideoNotFoundError`).
- Handle corrupted video file (throw `InvalidVideoError`).
- Handle video with no video stream (audio-only file).

**Interval sampling tests:**
- 60-second video at 1-second interval produces 60 timestamps.
- 60-second video at 5-second interval produces 12 timestamps.
- Interval larger than duration produces 1 timestamp (time 0).
- `maxFrames` caps the output.

**Uniform sampling tests:**
- `count: 10` on a 60-second video produces exactly 10 evenly spaced timestamps.
- `count: 1` produces a single timestamp at time 0.
- `count` greater than total frames produces one frame per available frame position.

**Scene change detection tests (histogram):**
- Two identical frames produce a distance of 0.0.
- Two completely different frames (black vs white) produce a distance near 1.0.
- Gradual brightness change produces a small distance.
- Hard cut (completely different content) produces a distance above 0.3.

**Scene change detection tests (pixel difference):**
- Identical frames produce a difference of 0.0.
- All-black vs all-white produces a difference of 1.0.
- Small object movement in a static scene produces a difference below 0.1.

**Scene change detection tests (pHash):**
- Identical images produce Hamming distance of 0.
- Structurally similar images (same scene, different compression) produce small distance.
- Completely different images produce large distance.

**Scene change detection tests (SSIM):**
- Identical frames produce SSIM of 1.0 (change score of 0.0).
- Completely different frames produce SSIM near 0.0 (change score near 1.0).
- Frames with only brightness change produce high SSIM (change score below threshold).

**Consensus tests:**
- Scene change detected by 3 of 3 algorithms passes consensus of 2.
- Scene change detected by 1 of 3 algorithms fails consensus of 2.
- Consensus of 1 passes any single algorithm detection.

**Deduplication tests:**
- Two identical frames: second is removed.
- Two very different frames: both kept.
- Sequence of gradually changing frames: removes intermediate frames that are too similar to kept frames.
- `dedup: false` keeps all frames regardless of similarity.
- `dedupThreshold: 1.0` removes only exact duplicates.
- `dedupThreshold: 0.0` removes everything except the first frame.

**Budget strategy tests:**
- Token budget of 765 with OpenAI high-detail (765 tokens/frame) produces 1 frame.
- Token budget of 5000 produces `floor(5000/765) = 6` frames.
- Selected frames are maximally diverse (verify via pHash diversity metric).
- Budget of 0 produces 0 frames.

**Output format tests:**
- JPEG output produces valid JPEG buffer (starts with FF D8 magic bytes).
- PNG output produces valid PNG buffer (starts with 89 50 4E 47 magic bytes).
- Quality parameter affects JPEG file size.
- `outputBase64: true` populates the `base64` field.
- `outputBase64: false` leaves `base64` undefined.

### Integration Tests

**End-to-end sampling tests:**
- Sample a known test video with each strategy and verify frame count, timestamp ordering, and image validity.
- Hybrid strategy on a video with 3 hard cuts: verify scene change frames are included alongside interval frames.
- Keyframe extraction produces valid frames with timestamps.
- All frames in the output are valid images (can be decoded by sharp).
- Frame timestamps are within the video's duration.

**vision-prep integration tests (when installed):**
- `prepareForProvider: 'openai'` produces content blocks with correct structure.
- Token counts are populated for each frame.
- Cost estimates are populated when model is specified.
- Without vision-prep installed, frames are returned as raw Buffers without token metadata.

**Large video tests:**
- Streaming mode (`sampleStream`) processes a long video without exceeding memory limits.
- `maxFrames` is respected even for long videos with many scene changes.

### CLI Tests

- `vidsnap-ai sample video.mp4` produces frame files in `./frames/`.
- `vidsnap-ai sample video.mp4 --output-dir ./out` writes to the specified directory.
- `vidsnap-ai sample video.mp4 --json` outputs JSON to stdout.
- `vidsnap-ai scenes video.mp4` outputs scene change timestamps.
- `vidsnap-ai info video.mp4` outputs video metadata.
- Invalid file path produces exit code 1.
- Invalid flags produce exit code 2.
- `--version` prints version and exits with code 0.
- `--help` prints help and exits with code 0.

### Edge Cases to Test

- Very short video (0.5 seconds): produces at least 1 frame.
- Very long video (2 hours): completes in reasonable time with streaming mode.
- Video with no visual changes (static image for 60 seconds): produces 1 frame after deduplication.
- Video with constant rapid changes (every frame different): maxFrames caps the output.
- Video with resolution change mid-stream (rare): handled gracefully.
- Video with variable frame rate: timestamps remain accurate.
- Corrupted video file: throws `InvalidVideoError` with descriptive message.
- Non-video file with video extension: throws `InvalidVideoError`.
- Video without ffmpeg installed: throws `FfmpegNotFoundError` with installation instructions.
- Buffer input (video data in memory): handled identically to file path input.

### Test Framework

Tests use Vitest, matching the project's existing configuration in `package.json`.

### Test Fixtures

Test fixtures include:
- `sample-10s.mp4`: 10-second video with 3 distinct scenes (for scene change and hybrid tests).
- `static-5s.mp4`: 5-second static image video (for deduplication tests).
- `slides-30s.mp4`: 30-second slide presentation with 5 slide transitions (for scene change and lecture analysis tests).

Fixtures are generated synthetically using `ffmpeg` (e.g., concatenating solid color frames with transitions) to avoid distributing copyrighted video and to produce deterministic, reproducible test inputs. A generation script in the test directory creates fixtures from scratch.

---

## 16. Performance

### Design Constraints

`vidsnap-ai` processes video files that can be gigabytes in size. A 60-minute 1080p video at a typical bitrate is approximately 1-4 GB. The package must handle these files without loading the entire decoded video into memory and without taking prohibitively long to process.

### Optimization Strategy

**Frame extraction via ffmpeg:** Frame extraction is delegated to `ffmpeg`, which is heavily optimized for video decoding. `ffmpeg` decodes only the requested frames, not the entire video. For keyframe extraction, `ffmpeg` skips inter-frame decoding entirely (`-skip_frame nokey`), making it 5-10x faster.

**Seek-based extraction:** For interval and uniform strategies, `ffmpeg` seeks to the requested timestamp and decodes a single frame. This avoids sequential decoding of all intermediate frames. `ffmpeg` uses the video's index (if available) for fast seeking.

**Downscaled comparison frames:** Scene change detection operates on frames downscaled to 320x240, not the video's native resolution. A 1920x1080 frame has 2,073,600 pixels; a 320x240 frame has 76,800 pixels -- a 27x reduction in data processed per comparison. The downscaled frames are sufficient for detecting visual changes.

**Streaming mode:** For `sampleStream()`, frames are extracted and yielded one at a time. The caller processes each frame before the next is extracted, keeping memory usage proportional to a single frame rather than all frames.

**Parallel extraction:** When multiple frames are needed at known timestamps (interval, uniform strategies), `ffmpeg` can extract multiple frames in a single pass over the video, avoiding repeated seeking.

### Performance Targets

| Input | Operation | Expected Time |
|-------|-----------|---------------|
| 10s 1080p video | `sample()` with hybrid, maxFrames 20 | < 2 s |
| 60s 1080p video | `sample()` with hybrid, maxFrames 20 | < 5 s |
| 60s 1080p video | `sample()` with interval (1s), 60 frames | < 3 s |
| 60s 1080p video | `sample()` with keyframe | < 1 s |
| 60s 1080p video | `detectScenes()` at 0.25s interval | < 4 s |
| 60s 1080p video | `getVideoInfo()` | < 200 ms |
| 10 min 1080p video | `sample()` with hybrid, maxFrames 30 | < 15 s |
| 60 min 1080p video | `sampleStream()` with scene detection | < 90 s |

Benchmarks assume a 2024 MacBook Pro, Node.js 22, system `ffmpeg` installed, `sharp` available. First invocation may be slower due to `ffmpeg` process startup overhead.

### Memory Usage

For the `sample()` function, peak memory usage is approximately:

- The image data for all extracted frames held simultaneously: N frames * frame_size_bytes. A 1080p JPEG frame at quality 85 is approximately 100-300 KB. 20 frames = 2-6 MB.
- The downscaled comparison frames for scene change detection: approximately 50-100 KB each, held in pairs (current and previous).
- Perceptual hash arrays for deduplication: 8 bytes per frame (64-bit hash). Negligible.

Total peak memory for a typical 20-frame extraction from a 1080p video: approximately 10-15 MB.

For `sampleStream()`, memory usage is bounded by a single frame plus comparison state: approximately 1-2 MB regardless of video length.

---

## 17. Dependencies

### Runtime Dependencies

| Package | Purpose | Why Not Avoid It |
|---------|---------|------------------|
| `fluent-ffmpeg` | Node.js wrapper for `ffmpeg`. Used for frame extraction, keyframe identification, video metadata via `ffprobe`, and all video decoding. | `ffmpeg` is the industry standard for video processing. `fluent-ffmpeg` provides a clean JavaScript API over the `ffmpeg` CLI. No viable pure-JavaScript alternative exists for video decoding at acceptable performance. |

### Peer Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| `sharp` | Image processing for scene change detection (histograms, pixel comparison, resizing) and perceptual hashing. | Optional. Without `sharp`, only interval/uniform/keyframe/custom strategies are available. |

### Optional Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| `vision-prep` | Provider-specific frame optimization: resizing, token estimation, content block formatting. | Optional. Without it, frames are returned as raw Buffers without token metadata. |

### System Dependencies

| Dependency | Purpose | Required |
|------------|---------|----------|
| `ffmpeg` | Video decoding, frame extraction, keyframe identification. | Required. Without `ffmpeg`, the package cannot process video files. |
| `ffprobe` | Video metadata extraction (duration, resolution, fps, codec). | Required. Typically installed alongside `ffmpeg`. |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler. |
| `vitest` | Test runner. |
| `eslint` | Linting. |
| `@types/node` | Node.js type definitions. |
| `@types/fluent-ffmpeg` | Type definitions for fluent-ffmpeg. |
| `sharp` | Dev dependency for tests (also peer dependency). |

### Why This Dependency Structure

The core dependency (`fluent-ffmpeg`) is a lightweight JavaScript wrapper that does not bundle `ffmpeg` itself. It provides the API for invoking `ffmpeg` when it is available and reports a clear error when it is not. `ffmpeg` is a system dependency because bundling it would add 50-100 MB to the package and create platform-specific distribution complexity.

`sharp` is a peer dependency because it provides the image processing capabilities needed for scene change detection and deduplication. Making it optional allows the package to function (with reduced features) in environments where native dependencies are problematic.

`vision-prep` is optional because not all users need provider-specific frame preparation. Users who only need raw frame extraction (for their own downstream processing) should not be forced to install image preparation dependencies.

---

## 18. File Structure

```
vidsnap-ai/
  package.json
  tsconfig.json
  SPEC.md
  README.md
  src/
    index.ts                       -- Public API exports
    sample.ts                      -- sample() function, orchestration
    stream.ts                      -- sampleStream() async iterable
    scenes.ts                      -- detectScenes() function
    info.ts                        -- getVideoInfo() function
    factory.ts                     -- createSampler() factory
    types.ts                       -- All TypeScript type definitions
    errors.ts                      -- Error classes
    strategies/
      index.ts                     -- Strategy dispatch
      interval.ts                  -- Fixed interval strategy
      scene.ts                     -- Scene change strategy
      keyframe.ts                  -- Keyframe (I-frame) extraction strategy
      hybrid.ts                    -- Hybrid (interval + scene) strategy
      uniform.ts                   -- Uniform count strategy
      budget.ts                    -- Token budget-aware strategy
      custom.ts                    -- Custom selector strategy
    detection/
      index.ts                     -- Algorithm dispatch and consensus
      histogram.ts                 -- Color histogram comparison
      pixel.ts                     -- Pixel difference comparison
      phash.ts                     -- Perceptual hash comparison
      ssim.ts                      -- Structural similarity (SSIM)
    dedup/
      index.ts                     -- Deduplication logic
      phash.ts                     -- Perceptual hash computation
    video/
      index.ts                     -- Video I/O orchestration
      ffmpeg.ts                    -- ffmpeg frame extraction wrapper
      ffprobe.ts                   -- ffprobe metadata extraction wrapper
      frame-extractor.ts           -- Single and batch frame extraction
    output/
      index.ts                     -- Output formatting orchestration
      base64.ts                    -- Base64 encoding
      provider.ts                  -- vision-prep integration
    cli.ts                         -- CLI entry point
  src/__tests__/
    sample.test.ts                 -- Main sample() function tests
    stream.test.ts                 -- sampleStream() tests
    scenes.test.ts                 -- detectScenes() tests
    info.test.ts                   -- getVideoInfo() tests
    factory.test.ts                -- createSampler() tests
    strategies/
      interval.test.ts             -- Interval strategy tests
      scene.test.ts                -- Scene change strategy tests
      keyframe.test.ts             -- Keyframe strategy tests
      hybrid.test.ts               -- Hybrid strategy tests
      uniform.test.ts              -- Uniform strategy tests
      budget.test.ts               -- Budget strategy tests
    detection/
      histogram.test.ts            -- Histogram comparison tests
      pixel.test.ts                -- Pixel difference tests
      phash.test.ts                -- Perceptual hash tests
      ssim.test.ts                 -- SSIM tests
      consensus.test.ts            -- Multi-algorithm consensus tests
    dedup/
      dedup.test.ts                -- Deduplication tests
    video/
      ffmpeg.test.ts               -- ffmpeg wrapper tests
      ffprobe.test.ts              -- ffprobe wrapper tests
    cli.test.ts                    -- CLI integration tests
    fixtures/
      generate-fixtures.sh         -- Script to generate test videos with ffmpeg
      sample-10s.mp4               -- 10s video with 3 scenes
      static-5s.mp4                -- 5s static image
      slides-30s.mp4               -- 30s slide presentation
  dist/                            -- Compiled output (generated by tsc)
```

---

## 19. Implementation Roadmap

### Phase 1: Core Pipeline (v0.1.0)

Implement the foundation: types, video metadata, frame extraction, and basic sampling strategies.

1. **Types and errors**: Define all TypeScript types in `types.ts` -- `SampledFrame`, `SampleResult`, `SampleOptions`, `VideoInfo`, `SceneChange`, `SamplingStrategy`, and all option interfaces. Define error classes in `errors.ts` -- `VideoNotFoundError`, `InvalidVideoError`, `FfmpegNotFoundError`.
2. **ffprobe wrapper**: Implement video metadata extraction in `video/ffprobe.ts`. Parse `ffprobe` JSON output to `VideoInfo`.
3. **ffmpeg frame extractor**: Implement single-frame and batch-frame extraction in `video/ffmpeg.ts` and `video/frame-extractor.ts`. Extract frames as JPEG Buffers at specified timestamps.
4. **Interval strategy**: Implement fixed-interval sampling in `strategies/interval.ts`.
5. **Uniform strategy**: Implement uniform-count sampling in `strategies/uniform.ts`.
6. **Keyframe strategy**: Implement I-frame extraction in `strategies/keyframe.ts` using `ffmpeg -skip_frame nokey`.
7. **Custom strategy**: Implement custom selector dispatch in `strategies/custom.ts`.
8. **sample() function**: Wire strategies together in `sample.ts`. Implement `maxFrames` capping. Export from `index.ts`.
9. **getVideoInfo() function**: Implement in `info.ts`. Export from `index.ts`.
10. **Base64 output**: Implement `outputBase64` option in `output/base64.ts`.
11. **Tests**: Unit tests for metadata extraction, frame extraction, interval/uniform/keyframe/custom strategies, and output formatting. Generate test fixture videos.

### Phase 2: Scene Change Detection (v0.2.0)

Add scene change detection algorithms and the scene-based sampling strategy.

1. **Histogram comparison**: Implement in `detection/histogram.ts`. Color histogram computation and chi-squared distance.
2. **Pixel difference**: Implement in `detection/pixel.ts`. Mean absolute pixel difference.
3. **Perceptual hash**: Implement in `detection/phash.ts`. DCT-based 64-bit perceptual hash and Hamming distance.
4. **SSIM**: Implement in `detection/ssim.ts`. Structural similarity computation.
5. **Consensus logic**: Implement multi-algorithm consensus in `detection/index.ts`.
6. **Scene change strategy**: Implement in `strategies/scene.ts`. Uses detection algorithms to select frames at scene boundaries.
7. **detectScenes() function**: Implement in `scenes.ts`. Export from `index.ts`.
8. **Tests**: Unit tests for each detection algorithm with synthetic test images. Integration tests with test videos.

### Phase 3: Hybrid, Dedup, and Budget (v0.3.0)

Add the hybrid strategy, frame deduplication, and budget-aware sampling.

1. **Frame deduplication**: Implement pHash-based deduplication in `dedup/index.ts`. Integrates as a post-processing step after any strategy.
2. **Hybrid strategy**: Implement in `strategies/hybrid.ts`. Merges interval and scene change frames, deduplicates by proximity.
3. **Budget strategy**: Implement in `strategies/budget.ts`. Greedy diversity-maximization within a token budget.
4. **createSampler() factory**: Implement in `factory.ts`. Pre-configures options for repeated use.
5. **Tests**: Deduplication tests, hybrid strategy tests, budget strategy tests, factory tests.

### Phase 4: Streaming, CLI, and Integrations (v0.4.0)

Add streaming mode, the CLI, and monorepo integrations.

1. **sampleStream()**: Implement streaming frame extraction as `AsyncIterable` in `stream.ts`.
2. **vision-prep integration**: Implement provider-specific frame preparation in `output/provider.ts`. Populate `tokens`, `cost`, and `contentBlock` fields.
3. **CLI**: Implement CLI argument parsing (`sample`, `scenes`, `info` commands) and output formatting in `cli.ts`.
4. **CLI tests**: End-to-end CLI integration tests.
5. **Tests**: Streaming mode tests, vision-prep integration tests.

### Phase 5: Polish and Production Readiness (v1.0.0)

1. **Performance optimization**: Parallel frame extraction, seek optimization, memory profiling.
2. **Edge case hardening**: All edge cases from the testing strategy (empty video, corrupted files, very long videos, variable frame rate).
3. **Error messages**: Descriptive error messages for all failure modes (video not found, ffmpeg not installed, unsupported codec, corrupted video).
4. **Documentation**: Comprehensive README with examples for every common use case.

---

## 20. Example Use Cases

### 20.1 Video Q&A Pipeline

A video analysis application allows users to ask questions about uploaded videos. The application extracts representative frames, sends them with the user's question to a vision LLM, and returns the answer.

```typescript
import { sample } from 'vidsnap-ai';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function analyzeVideo(videoPath: string, question: string): Promise<string> {
  const result = await sample(videoPath, {
    strategy: 'hybrid',
    maxFrames: 15,
    prepareForProvider: 'anthropic',
    model: 'claude-sonnet-4-5',
  });

  console.log(`Extracted ${result.frames.length} frames, ~${result.meta.estimatedTokensUsed} tokens`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        ...result.frames.map(f => f.contentBlock!),
        { type: 'text', text: question },
      ],
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

const answer = await analyzeVideo('./cooking-tutorial.mp4', 'What ingredients are used in this recipe?');
console.log(answer);
```

### 20.2 Lecture Slide Extraction

An educational platform automatically extracts unique slides from recorded lectures, producing one image per slide for study materials.

```typescript
import { sample } from 'vidsnap-ai';
import { writeFile } from 'node:fs/promises';

const result = await sample('./lecture-recording.mp4', {
  strategy: 'scene',
  threshold: 0.2,
  algorithm: 'histogram',
  dedup: true,
  dedupThreshold: 0.85,
  outputFormat: 'png',
  quality: 95,
});

console.log(`Found ${result.frames.length} unique slides in ${result.video.duration}s lecture`);

for (const frame of result.frames) {
  await writeFile(`./slides/slide-${frame.index + 1}.png`, frame.buffer);
  console.log(`Slide ${frame.index + 1}: ${frame.timestamp.toFixed(0)}s`);
}
```

### 20.3 Content Moderation Pipeline

A platform screens uploaded videos for policy violations by sampling frames and sending them to a vision LLM for content classification.

```typescript
import { sample } from 'vidsnap-ai';

async function moderateVideo(videoPath: string): Promise<{ safe: boolean; flags: string[] }> {
  const result = await sample(videoPath, {
    strategy: 'hybrid',
    maxFrames: 30,
    intervalSeconds: 3,
    threshold: 0.25,
    prepareForProvider: 'openai',
    detail: 'low',  // low detail = 85 tokens/frame, cost-efficient for moderation
    model: 'gpt-4o',
  });

  console.log(`Screening ${result.frames.length} frames, ~${result.meta.estimatedTokensUsed} tokens`);
  // 30 frames * 85 tokens = 2,550 tokens ~ $0.006

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Review these video frames for content policy violations. List any concerns.' },
        ...result.frames.map(f => f.contentBlock!),
      ],
    }],
  });

  // Parse moderation response...
  return { safe: true, flags: [] };
}
```

### 20.4 Security Footage Analysis

A security system analyzes hours of surveillance footage, extracting only the frames where something changes in the scene.

```typescript
import { sample, getVideoInfo } from 'vidsnap-ai';

async function analyzeSurveillance(videoPath: string) {
  const info = await getVideoInfo(videoPath);
  console.log(`Processing ${(info.duration / 3600).toFixed(1)} hours of footage`);

  const result = await sample(videoPath, {
    strategy: 'scene',
    threshold: 0.2,
    algorithm: 'pixel',  // pixel diff works well for static cameras
    dedup: true,
    dedupThreshold: 0.95,
    maxFrames: 200,
  });

  console.log(`${result.frames.length} events detected in ${info.duration}s`);
  console.log(`${result.meta.sceneChangesDetected} scene changes, ${result.meta.framesDeduped} duplicates removed`);

  for (const frame of result.frames) {
    if (frame.isSceneChange) {
      console.log(`Event at ${formatTime(frame.timestamp)}: change score ${frame.sceneChangeScore?.toFixed(3)}`);
    }
  }
}
```

### 20.5 Video Search Indexing

A video platform generates visual descriptions for search indexing by extracting frames and sending them to a vision LLM for description.

```typescript
import { sample } from 'vidsnap-ai';

async function indexVideo(videoPath: string, videoId: string) {
  const result = await sample(videoPath, {
    strategy: 'budget',
    tokenBudget: 5000,
    provider: 'gemini',
    prepareForProvider: 'gemini',
    model: 'gemini-2.5-flash',
  });

  // At 258 tokens/frame for Gemini: 5000/258 = 19 frames
  console.log(`Indexing ${result.frames.length} frames (${result.meta.estimatedTokensUsed} tokens)`);

  const description = await gemini.generateContent({
    contents: [{
      parts: [
        { text: 'Describe the visual content of this video in detail for search indexing.' },
        ...result.frames.map(f => f.contentBlock!),
      ],
    }],
  });

  await saveToSearchIndex(videoId, description.text, result.frames.map(f => f.timestamp));
}
```

### 20.6 CLI Batch Processing

Extracting frames from a directory of videos for manual review or dataset creation.

```bash
# Extract frames from all videos in a directory
for f in videos/*.mp4; do
  vidsnap-ai sample "$f" \
    --strategy hybrid \
    --max-frames 20 \
    --threshold 0.3 \
    --output-dir "frames/$(basename "$f" .mp4)" \
    --format jpeg \
    --quality 90
done

# Get scene change timestamps for a video
vidsnap-ai scenes lecture.mp4 --algorithm histogram --threshold 0.2

# Quick video info
vidsnap-ai info video.mp4 --json

# Extract frames as JSON with base64 for API consumption
vidsnap-ai sample video.mp4 --strategy scene --max-frames 10 --json --base64 > frames.json
```
