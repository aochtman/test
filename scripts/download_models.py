"""
Model downloader for AI Image & Video Generator.
Downloads required models from HuggingFace with progress bars.
Run from the project root: python scripts/download_models.py
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
COMFYUI_DIR = PROJECT_ROOT / "ComfyUI"

# Model definitions: (repo_id, filename, destination subdir under ComfyUI/models/)
MODELS = [
    # Chroma Q8 GGUF - primary txt2img model
    {
        "repo": "city96/Chroma-Q8_0-GGUF",
        "file": "chroma-q8_0.gguf",
        "dest": "diffusion_models",
        "desc": "Chroma Q8 GGUF (8.9B, ~9GB)",
    },
    # T5-XXL FP8 - text encoder for Chroma/Flux
    {
        "repo": "comfyanonymous/flux_text_encoders",
        "file": "t5xxl_fp8_e4m3fn.safetensors",
        "dest": "text_encoders",
        "desc": "T5-XXL FP8 text encoder (~5GB)",
    },
    # Flux VAE
    {
        "repo": "black-forest-labs/FLUX.1-schnell",
        "file": "ae.safetensors",
        "dest": "vae",
        "desc": "Flux VAE (~168MB)",
    },
    # Wan 2.2 14B I2V GGUF - image-to-video
    {
        "repo": "city96/Wan2.1-I2V-14B-480P-GGUF",
        "file": "wan2.1-i2v-14b-480p-Q4_K_M.gguf",
        "dest": "diffusion_models",
        "desc": "Wan 2.2 14B I2V Q4_K_M (~8GB)",
    },
    # Wan 2.2 CLIP vision
    {
        "repo": "Comfy-Org/Wan_2.1_ComfyUI_repackaged",
        "file": "split_files/clip_vision/cv_wan2.1_image.safetensors",
        "dest": "clip_vision",
        "desc": "Wan 2.1 CLIP Vision (~1GB)",
    },
    # Wan 2.2 VAE
    {
        "repo": "Comfy-Org/Wan_2.1_ComfyUI_repackaged",
        "file": "split_files/vae/wan_2.1_vae.safetensors",
        "dest": "vae",
        "desc": "Wan 2.1 VAE (~200MB)",
    },
    # Wan 2.2 text encoder
    {
        "repo": "Comfy-Org/Wan_2.1_ComfyUI_repackaged",
        "file": "split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors",
        "dest": "text_encoders",
        "desc": "Wan 2.1 T5 text encoder FP8 (~5GB)",
    },
]

# Prompt enhancer model (separate from ComfyUI)
PROMPT_ENHANCER_MODEL = {
    "repo": "microsoft/Phi-3-mini-4k-instruct-gguf",
    "file": "Phi-3-mini-4k-instruct-q4.gguf",
    "dest": "prompt_enhancer",
    "desc": "Phi-3 Mini GGUF for prompt enhancement (~2.3GB)",
}


def ensure_huggingface_hub():
    """Install huggingface_hub if not present."""
    try:
        import huggingface_hub  # noqa: F401
    except ImportError:
        print("Installing huggingface_hub...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub[hf_transfer]"])


def download_model(model_info, base_dir):
    """Download a single model file."""
    from huggingface_hub import hf_hub_download

    dest_dir = base_dir / model_info["dest"]
    dest_dir.mkdir(parents=True, exist_ok=True)

    filename = model_info["file"].split("/")[-1]  # handle nested paths
    dest_file = dest_dir / filename

    if dest_file.exists():
        print(f"  Already downloaded: {filename}")
        return True

    print(f"  Downloading: {model_info['desc']}")
    print(f"  From: {model_info['repo']}")
    print(f"  To:   {dest_dir}")

    try:
        hf_hub_download(
            repo_id=model_info["repo"],
            filename=model_info["file"],
            local_dir=dest_dir,
            local_dir_use_symlinks=False,
        )
        # hf_hub_download preserves repo structure, move file if nested
        downloaded = dest_dir / model_info["file"]
        if downloaded != dest_file and downloaded.exists():
            downloaded.rename(dest_file)
            # Clean up empty parent dirs
            for parent in downloaded.parents:
                if parent == dest_dir:
                    break
                try:
                    parent.rmdir()
                except OSError:
                    break
        print(f"  Done: {filename}")
        return True
    except Exception as e:
        print(f"  ERROR downloading {filename}: {e}")
        return False


def main():
    print("=" * 60)
    print("Model Downloader")
    print("=" * 60)

    ensure_huggingface_hub()

    models_dir = COMFYUI_DIR / "models"
    if not COMFYUI_DIR.exists():
        print(f"ERROR: ComfyUI not found at {COMFYUI_DIR}")
        print("Run install_comfyui.py first.")
        sys.exit(1)

    print(f"\nDownloading to: {models_dir}")
    print(f"Models to download: {len(MODELS) + 1}\n")

    success = 0
    failed = 0

    # ComfyUI models
    for model in MODELS:
        print(f"\n[{success + failed + 1}/{len(MODELS) + 1}] {model['desc']}")
        if download_model(model, models_dir):
            success += 1
        else:
            failed += 1

    # Prompt enhancer model (stored in project root, not ComfyUI)
    print(f"\n[{success + failed + 1}/{len(MODELS) + 1}] {PROMPT_ENHANCER_MODEL['desc']}")
    enhancer_dir = PROJECT_ROOT / "backend" / "models"
    if download_model(PROMPT_ENHANCER_MODEL, enhancer_dir):
        success += 1
    else:
        failed += 1

    print("\n" + "=" * 60)
    print(f"Download complete: {success} succeeded, {failed} failed")
    if failed > 0:
        print("Re-run this script to retry failed downloads.")
    print("=" * 60)


if __name__ == "__main__":
    main()
