# AI Image & Video Generator - Implementation Plan

## Context

Build a local, fully unrestricted AI image and video generation web app. The user has an RTX 5080 (16GB VRAM) on Windows with fast NVMe storage. The app must support text-to-image, image-to-image, and image-to-video generation with no content filters. CivitAI community model support (SDXL/Pony checkpoints and LoRAs) is required for access to specialized NSFW models.

## Architecture: Gradio + Diffusers + Local LLM

**Why Gradio**: Simple prompt-based UI, fast to build, supports image upload/gallery/sliders natively. No separate frontend build step.

**Why not ComfyUI**: While powerful, ComfyUI is node-based and complex. The user wants a clean prompt-based interface.

**Why not Docker**: GPU passthrough on Windows adds friction. Native Python venv is simpler and has zero GPU overhead.

**Deployment**: Code developed on dev-server (this machine), then cloned/pulled and run directly on the Windows desktop. App opens in local browser at `http://localhost:7860`.

## Models

| Task | Primary Model | Alternative | VRAM |
|------|--------------|-------------|------|
| Text-to-Image | Pony Diffusion V6 XL (SDXL) | Flux.1 Dev GGUF Q8 (uncensored fork) | 8-12GB |
| Image-to-Image | Same as above (img2img pipeline) | — | 8-12GB |
| Image-to-Video | Wan 2.1 (GGUF quantized) | CogVideoX 1.5 5B | 12-16GB |
| Prompt Enhancement | Mistral 7B via llama-cpp-python | Manual prompts | CPU-only |

**Model management**: Only one large model loaded at a time. Automatic unloading when switching between image and video generation.

## Tech Stack

- **Python 3.11+** with venv
- **PyTorch 2.7+** with CUDA 12.8 (required for RTX 5080 / Blackwell sm_120)
- **diffusers** (HuggingFace) - pipeline management for SDXL, Flux, img2img
- **Gradio 5.x** - web UI
- **llama-cpp-python** - local LLM for NSFW-safe prompt enhancement
- **safetensors** - model loading
- **accelerate** - memory management
- **CivitAI model loading** - custom checkpoint/LoRA support via diffusers

## File Structure

```
/
├── app.py                    # Main Gradio app entry point
├── requirements.txt          # Python dependencies
├── setup.py                  # First-run setup script (downloads models)
├── config.py                 # App configuration (paths, defaults)
├── README.md                 # Setup instructions for Windows
│
├── core/
│   ├── __init__.py
│   ├── model_manager.py      # Model loading/unloading, VRAM management
│   ├── text_to_image.py      # txt2img pipeline (SDXL, Flux, CivitAI checkpoints)
│   ├── image_to_image.py     # img2img pipeline
│   ├── image_to_video.py     # img2vid pipeline (Wan 2.1 / CogVideoX)
│   └── prompt_enhancer.py    # Local LLM prompt enhancement
│
├── ui/
│   ├── __init__.py
│   ├── txt2img_tab.py        # Text-to-image Gradio tab
│   ├── img2img_tab.py        # Image-to-image Gradio tab
│   ├── img2vid_tab.py        # Image-to-video Gradio tab
│   └── settings_tab.py       # Model selection, paths, parameters
│
├── outputs/                  # Generated files (hidden from Windows)
│   ├── images/               # Generated images
│   └── videos/               # Generated videos
│
└── models/                   # Local model storage (gitignored)
    ├── checkpoints/          # SDXL/Pony/Flux checkpoints
    ├── loras/                # LoRA files
    ├── vae/                  # VAE models
    └── llm/                  # Prompt enhancement LLM
```

## Implementation Steps

### Step 1: Project scaffolding
- Create file structure, `requirements.txt`, `config.py`, `.gitignore`
- Requirements: `torch`, `torchvision`, `diffusers`, `transformers`, `accelerate`, `safetensors`, `gradio`, `llama-cpp-python`, `Pillow`, `opencv-python`
- **Privacy setup for outputs folder**:
  - Set Windows hidden attribute on `outputs/` folder via `attrib +h` (done in setup script)
  - Create `outputs/desktop.ini` to exclude from Windows libraries
  - Add `outputs/` to Windows Search indexing exclusion via registry/API
  - The app's built-in Gradio gallery is the primary way to browse generated content
  - All generated files saved with randomized filenames (no metadata leakage)

### Step 2: Model Manager (`core/model_manager.py`)
- Singleton that tracks currently loaded model
- `load_model(model_type, model_path)` - loads a model, unloads previous
- `unload_model()` - frees VRAM via `torch.cuda.empty_cache()`
- Support loading CivitAI safetensors checkpoints via `StableDiffusionXLPipeline.from_single_file()`
- Support loading LoRAs via `pipe.load_lora_weights()`

### Step 3: Text-to-Image (`core/text_to_image.py`)
- SDXL pipeline with CivitAI checkpoint support
- Flux pipeline with GGUF quantized model support
- Parameters: prompt, negative prompt, steps, CFG scale, seed, resolution, sampler, LoRA selection
- Batch generation (1-4 images)

### Step 4: Image-to-Image (`core/image_to_image.py`)
- Uses same model as txt2img but with `StableDiffusionXLImg2ImgPipeline`
- Additional params: input image, denoising strength
- Support inpainting mask (optional)

### Step 5: Image-to-Video (`core/image_to_video.py`)
- Wan 2.1 pipeline for img2vid
- Parameters: input image, prompt, duration, FPS, motion strength
- Output as MP4

### Step 6: Prompt Enhancer (`core/prompt_enhancer.py`)
- Load Mistral 7B GGUF via llama-cpp-python (CPU-only, no VRAM usage)
- System prompt tuned for expanding short prompts into detailed image generation prompts
- No content filtering - fully unrestricted
- Optional - user can toggle on/off

### Step 7: Gradio UI (`ui/` + `app.py`)
- **Tab 1 - Text to Image**: Prompt box, negative prompt, model selector (dropdown of checkpoints in models/checkpoints/), LoRA selector, generation params (steps, CFG, seed, resolution, sampler), generate button, image gallery
- **Tab 2 - Image to Image**: Same as above + image upload + denoising strength slider
- **Tab 3 - Image to Video**: Image upload (or use last generated image), prompt, duration/FPS/motion sliders, generate button, video player
- **Tab 4 - Settings**: Model paths, download models, GPU info display

### Step 8: Output privacy (`core/privacy.py`)
- On first run (Windows): set hidden attribute on outputs folder (`ctypes` call to `SetFileAttributesW`)
- Write `desktop.ini` in outputs folder to prevent Windows from treating it as a media library
- Strip EXIF/metadata from generated images before saving
- Use UUID-based filenames (no sequential numbering)
- Provide a "purge all outputs" button in settings tab
- Display warning in UI: "Use the built-in gallery to browse outputs. Opening files with Windows Photos will add them to the Photos library. Use IrfanView or XnView for safe external viewing."

### Step 9: Setup script (`setup.py`)
- Downloads base models (Pony Diffusion V6 XL, Mistral 7B GGUF)
- Validates CUDA/PyTorch compatibility
- Creates model directories
- Runs privacy setup for outputs folder

## Verification

1. **Setup**: Run `pip install -r requirements.txt` then `python setup.py` to download models
2. **Launch**: Run `python app.py`, opens browser at `http://localhost:7860`
3. **Test txt2img**: Enter a prompt, select Pony Diffusion checkpoint, generate
4. **Test img2img**: Upload an image, adjust denoising strength, generate
5. **Test img2vid**: Use a generated image, create a short video clip
6. **Test prompt enhancer**: Toggle on, enter a short prompt, verify it expands
7. **Test CivitAI models**: Download a .safetensors checkpoint, place in models/checkpoints/, verify it appears in dropdown
