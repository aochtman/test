# AI Image & Video Generator - Implementation Plan

## Context

Build a local, fully unrestricted AI image and video generation web app. The user has an RTX 5080 (16GB VRAM) on Windows with fast NVMe RAID0 storage (17GB/s read). The app must support text-to-image, image-to-image, and image-to-video generation with no content filters. CivitAI community model support (SDXL checkpoints and LoRAs) is required.

## Architecture: ComfyUI Backend + React Frontend

**ComfyUI runs headlessly** as the inference engine (port 8188). A custom React frontend provides a clean prompt-based UI (port 3000). No node editor exposed to the user.

**Why ComfyUI backend**: ~15x faster than raw diffusers, battle-tested VRAM management, native GGUF quantization, NVFP4 support for Blackwell (RTX 5080), community nodes for new models within days of release.

**Why React frontend**: Clean prompt-based UI without ComfyUI's node complexity. Full control over UX.

**Why not Docker**: GPU passthrough on Windows adds friction. Native Python venv is simpler.

**Deployment**: Code developed on dev-server, then cloned and run directly on the Windows desktop. App opens in local browser at `http://localhost:3000`.

## Models

| Task | Primary Model | Alternative | VRAM |
|------|--------------|-------------|------|
| Text-to-Image | Chroma Q8 GGUF (8.9B, uncensored, 1-4 steps) | Flux.1 Dev Q8 GGUF | 12-13GB |
| Text-to-Image | SDXL + CivitAI LoRAs (art styles, specialized) | — | 4-8GB |
| Image-to-Image | Same models via img2img workflow | — | same |
| Image-to-Video | Wan 2.2 14B I2V GGUF Q4_K_M | CogVideoX 1.5 5B FP8 | 8-14GB |
| Prompt Enhancement | Phi-3 GGUF via llama-cpp-python | Manual prompts | CPU-only |

**Model management**: ComfyUI handles loading/unloading automatically. Only one large model in VRAM at a time. 17GB/s NVMe means model swaps take <1 second. VRAM is fully released when idle (see VRAM Management below).

## Tech Stack

- **ComfyUI** - headless inference engine with REST + WebSocket API
- **ComfyUI-GGUF** - GGUF quantization support
- **ComfyUI-WanVideoWrapper** - Wan 2.2 img2vid
- **ComfyUI-CogVideoXWrapper** - CogVideoX img2vid
- **React + TypeScript + Vite** - frontend
- **Tailwind CSS** - dark theme styling
- **Zustand** - state management
- **llama-cpp-python** - local LLM prompt enhancement (CPU)
- **Python 3.11+**, **PyTorch 2.7+** with CUDA 12.8

## VRAM Management

The machine is shared between this app and gaming (~10GB VRAM during sessions). VRAM must be fully released when not actively generating.

**Strategy: Auto-release on idle + manual release button**

- **Auto-release**: Frontend tracks idle time since last generation. After 5 minutes of inactivity, automatically calls ComfyUI's `POST /free` endpoint to unload all models from VRAM. VRAM drops to near-zero.
- **Manual release**: "Release VRAM" button in the sidebar and Settings page. Calls `POST /free` immediately. Use before launching a game.
- **VRAM status indicator**: Sidebar shows current GPU memory usage (via ComfyUI `GET /system_stats`). Green (< 1GB used) = safe to game. Red (model loaded) = VRAM in use.
- **Zero-cost reload**: Models reload from NVMe in <1 second, so releasing VRAM has no meaningful penalty. The next generation simply reloads the model on demand.

**Lifecycle**:
```
App idle (>5min) ──auto──> /free called ──> VRAM = ~0 ──> safe to game
User clicks "Release VRAM" ──> /free called ──> VRAM = ~0 ──> safe to game
User generates image ──> model auto-loads (<1s) ──> VRAM = model size ──> idle timer resets
```

**Why not `--novram` flag**: Running ComfyUI with `--novram` keeps models in system RAM and copies to VRAM per-generation. This adds latency to every generation. Since auto-release achieves the same goal (zero VRAM when idle) without per-generation overhead, it's the better approach.

## File Structure

```
/
├── README.md
├── setup.bat                         # Windows one-click setup
├── start.bat                         # Windows launcher (ComfyUI + frontend)
│
├── backend/
│   ├── requirements.txt              # Python deps for prompt enhancer
│   ├── prompt_enhancer.py            # Local LLM prompt enhancement server
│   ├── privacy.py                    # Windows output folder privacy setup
│   │
│   └── workflows/                    # Pre-built ComfyUI workflow JSONs
│       ├── txt2img_chroma.json
│       ├── txt2img_sdxl.json
│       ├── img2img_chroma.json
│       ├── img2img_sdxl.json
│       ├── img2vid_wan22.json
│       └── img2vid_cogvideox.json
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   ├── comfyui.ts            # ComfyUI REST + WebSocket client
│       │   ├── promptEnhancer.ts     # Prompt enhancer API client
│       │   └── types.ts
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx
│       │   ├── PromptInput.tsx
│       │   ├── GenerationSettings.tsx
│       │   ├── ImageGallery.tsx
│       │   ├── VideoPlayer.tsx
│       │   ├── ProgressBar.tsx
│       │   └── VramIndicator.tsx     # VRAM status + release button
│       ├── pages/
│       │   ├── TextToImage.tsx
│       │   ├── ImageToImage.tsx
│       │   ├── ImageToVideo.tsx
│       │   └── Settings.tsx
│       ├── hooks/
│       │   ├── useComfyUI.ts
│       │   ├── useGeneration.ts
│       │   └── useVramManager.ts     # Idle timer + auto-release logic
│       └── stores/
│           └── generationStore.ts
│
├── scripts/
│   ├── install_comfyui.py            # Automated ComfyUI + custom nodes setup
│   └── download_models.py            # Model downloader with progress bars
│
└── outputs/                          # Generated files (hidden from Windows)
    ├── images/
    └── videos/
```

## Implementation Steps

### Step 1: Project scaffolding & setup scripts
- Create file structure, `.gitignore` (exclude `outputs/`, `node_modules/`, ComfyUI models)
- `scripts/install_comfyui.py`: clone ComfyUI, install custom nodes (ComfyUI-GGUF, ComfyUI-Manager, ComfyUI-WanVideoWrapper, ComfyUI-CogVideoXWrapper), create venv, install PyTorch 2.7+ with CUDA 12.8
- `scripts/download_models.py`: download Chroma Q8 GGUF, T5-XXL FP8, VAE, Phi-3 GGUF via huggingface_hub
- `setup.bat`: runs both scripts end-to-end
- `start.bat`: launches ComfyUI headless on port 8188, then frontend on port 3000

### Step 2: ComfyUI workflow JSONs
- `txt2img_chroma.json`: UNet Loader (GGUF) -> T5-XXL -> KSampler (4 steps) -> VAE Decode -> Save Image
- `txt2img_sdxl.json`: SDXL checkpoint loader -> CLIP -> KSampler -> VAE Decode -> Save Image (with LoRA loader node)
- `img2img_chroma.json`: same as txt2img + Load Image -> VAE Encode -> KSampler with denoise param
- `img2img_sdxl.json`: same pattern for SDXL
- `img2vid_wan22.json`: Wan 2.2 GGUF loader -> source image -> KSampler -> video output
- `img2vid_cogvideox.json`: CogVideoX loader -> source image -> video output
- All workflows use parameterized values (prompt, seed, steps, etc.) that the frontend substitutes before submission

### Step 3: ComfyUI API client (`frontend/src/api/comfyui.ts`)
- REST: POST `/prompt` (queue workflow), GET `/history` (results), POST `/upload/image` (img2img input)
- REST: POST `/free` (release all models from VRAM), GET `/system_stats` (GPU memory usage)
- WebSocket: connect to `ws://localhost:8188/ws` for real-time progress (execution_start, progress per step, executed with output paths)
- Workflow template system: load JSON, substitute user parameters, submit
- Fetch generated images via `GET /view?filename={name}`

### Step 4: Frontend scaffolding
- Vite + React + TypeScript project
- Tailwind CSS dark theme
- Layout: sidebar nav (txt2img / img2img / img2vid / settings) + main content
- VRAM status indicator in sidebar (green/red dot with memory usage)
- "Release VRAM" button in sidebar
- Zustand store for generation state, history, settings
- `useVramManager` hook: polls `/system_stats` every 10s, tracks idle time since last generation, auto-calls `/free` after 5 minutes idle

### Step 5: Text-to-Image page
- Prompt textarea + optional negative prompt
- Model selector: Chroma, SDXL + checkpoint dropdown (scans ComfyUI models dir)
- LoRA selector (for SDXL)
- Settings: resolution, steps, CFG scale, seed, batch size (1-4)
- Generate button -> submit workflow -> progress bar -> image gallery
- "Enhance Prompt" button (calls prompt enhancer)

### Step 6: Image-to-Image page
- Image upload (drag-and-drop)
- Same prompt/model/settings as txt2img
- Denoise strength slider (0.0-1.0) - key control
- "Use from gallery" button to load a previously generated image

### Step 7: Image-to-Video page
- Source image upload or select from gallery
- Model selector: Wan 2.2 / CogVideoX
- Settings: duration, FPS, resolution, motion prompt
- Generate -> progress bar -> video player
- Download as MP4

### Step 8: Prompt enhancer (`backend/prompt_enhancer.py`)
- FastAPI micro-service on port 8189
- Loads Phi-3 GGUF via llama-cpp-python on CPU (no VRAM usage)
- POST `/enhance` with short prompt -> returns detailed expanded prompt
- System prompt tuned for image generation descriptions, unrestricted
- Toggle on/off in frontend

### Step 9: Output privacy (`backend/privacy.py`)
- Run on first setup (Windows): set hidden attribute on outputs folder via `ctypes.windll.kernel32.SetFileAttributesW`
- Write `desktop.ini` to exclude from Windows libraries
- Strip EXIF metadata from saved images
- UUID-based filenames
- "Purge all outputs" button in Settings page
- Warning in UI: "Use the built-in gallery. Opening files with Windows Photos will add them to the Photos library."

### Step 10: Settings page
- Installed models list with VRAM estimates
- GPU memory usage display (ComfyUI system_stats API)
- "Release VRAM" button (calls `/free`, same as sidebar button)
- Auto-release idle timeout setting (default: 5 minutes, configurable)
- Output folder path config
- Purge outputs button
- Model download links/instructions

## ComfyUI API Integration Pattern

```
1. Frontend loads workflow JSON template
2. Substitutes user values (prompt, model, settings) into JSON
3. POST to http://localhost:8188/prompt with {prompt: workflow, client_id: uuid}
4. Connect WebSocket ws://localhost:8188/ws?clientId={uuid}
5. Receive progress events: execution_start -> executing (per node) -> progress (per step) -> executed
6. Fetch result: GET http://localhost:8188/view?filename={output_name}
```

## VRAM Budget (RTX 5080 16GB)

| Model | VRAM | Headroom |
|-------|------|----------|
| Chroma Q8 GGUF | ~12-13GB | 3-4GB for VAE + text encoder |
| SDXL + LoRA | ~6-8GB | 8-10GB spare |
| Wan 2.2 14B Q4_K_M | ~8-10GB | 6-8GB with VAE tiling |
| CogVideoX 1.5 5B FP8 | ~12-14GB | 2-4GB |

ComfyUI auto-unloads models when switching. 17GB/s NVMe = <1s model load times.

| State | VRAM Usage | Notes |
|-------|-----------|-------|
| App idle (>5min) | ~0 | Auto-released, safe for gaming |
| Manual release | ~0 | Instant, safe for gaming |
| Gaming (typical) | ~10GB | No conflict when app is idle |
| Generating (Chroma) | ~13GB | Cannot game simultaneously |
| Generating (SDXL) | ~8GB | Tight fit with some games |

## Verification

1. **Setup**: Run `setup.bat` on Windows - installs ComfyUI, custom nodes, downloads models
2. **Launch**: Run `start.bat` - ComfyUI starts on 8188, frontend on 3000
3. **Test txt2img**: Open `http://localhost:3000`, select Chroma, enter prompt, generate
4. **Test img2img**: Upload image, set denoise to 0.7, modify with prompt
5. **Test img2vid**: Use generated image, create video with Wan 2.2
6. **Test prompt enhancer**: Toggle on, enter short prompt, verify expansion
7. **Test privacy**: Check outputs folder is hidden, files don't appear in Windows Photos
8. **Test CivitAI models**: Place .safetensors in ComfyUI models dir, verify it appears in frontend dropdown
9. **Test VRAM release**: Generate an image, click "Release VRAM", verify GPU memory drops to ~0 via `nvidia-smi`
10. **Test auto-release**: Generate an image, wait 5 minutes idle, verify GPU memory auto-releases
11. **Test gaming coexistence**: Release VRAM, launch a game, confirm no VRAM conflicts
