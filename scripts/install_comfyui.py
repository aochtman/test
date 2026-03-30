"""
Automated ComfyUI installation script for Windows.
Clones ComfyUI, installs custom nodes, creates venv, and installs dependencies.
Run from the project root: python scripts/install_comfyui.py
"""

import subprocess
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
COMFYUI_DIR = PROJECT_ROOT / "ComfyUI"
VENV_DIR = COMFYUI_DIR / "venv"

CUSTOM_NODES = {
    "ComfyUI-GGUF": "https://github.com/city96/ComfyUI-GGUF.git",
    "ComfyUI-Manager": "https://github.com/ltdrdata/ComfyUI-Manager.git",
    "ComfyUI-WanVideoWrapper": "https://github.com/kijai/ComfyUI-WanVideoWrapper.git",
    "ComfyUI-CogVideoXWrapper": "https://github.com/kijai/ComfyUI-CogVideoXWrapper.git",
}

# PyTorch 2.7+ with CUDA 12.8
PYTORCH_INDEX = "https://download.pytorch.org/whl/cu128"
PYTORCH_PACKAGES = [
    "torch",
    "torchvision",
    "torchaudio",
]


def run(cmd, cwd=None, check=True):
    """Run a command and stream output."""
    print(f"\n>>> {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, cwd=cwd, check=check, shell=isinstance(cmd, str))
    return result


def clone_comfyui():
    """Clone ComfyUI if not already present."""
    if COMFYUI_DIR.exists():
        print(f"ComfyUI already exists at {COMFYUI_DIR}, skipping clone.")
        return
    print("Cloning ComfyUI...")
    run(["git", "clone", "https://github.com/comfyanonymous/ComfyUI.git", str(COMFYUI_DIR)])


def install_custom_nodes():
    """Clone custom nodes into ComfyUI/custom_nodes/."""
    custom_nodes_dir = COMFYUI_DIR / "custom_nodes"
    custom_nodes_dir.mkdir(exist_ok=True)

    for name, url in CUSTOM_NODES.items():
        node_dir = custom_nodes_dir / name
        if node_dir.exists():
            print(f"Custom node {name} already exists, pulling latest...")
            run(["git", "pull"], cwd=node_dir)
        else:
            print(f"Cloning {name}...")
            run(["git", "clone", url, str(node_dir)])


def create_venv():
    """Create a Python venv inside ComfyUI/."""
    if VENV_DIR.exists():
        print(f"Venv already exists at {VENV_DIR}, skipping creation.")
        return
    print("Creating Python virtual environment...")
    run([sys.executable, "-m", "venv", str(VENV_DIR)])


def get_pip():
    """Get the path to pip in the venv."""
    if os.name == "nt":
        return str(VENV_DIR / "Scripts" / "pip.exe")
    return str(VENV_DIR / "bin" / "pip")


def get_python():
    """Get the path to python in the venv."""
    if os.name == "nt":
        return str(VENV_DIR / "Scripts" / "python.exe")
    return str(VENV_DIR / "bin" / "python")


def install_pytorch():
    """Install PyTorch with CUDA 12.8 support."""
    python = get_python()
    print("Installing PyTorch with CUDA 12.8...")
    run([python, "-m", "pip", "install", "--upgrade", "pip"])
    run([python, "-m", "pip", "install", *PYTORCH_PACKAGES, "--index-url", PYTORCH_INDEX])


def install_comfyui_deps():
    """Install ComfyUI's requirements."""
    python = get_python()
    req_file = COMFYUI_DIR / "requirements.txt"
    if req_file.exists():
        print("Installing ComfyUI requirements...")
        run([python, "-m", "pip", "install", "-r", str(req_file)])


def install_custom_node_deps():
    """Install requirements for each custom node."""
    python = get_python()
    custom_nodes_dir = COMFYUI_DIR / "custom_nodes"

    for name in CUSTOM_NODES:
        req_file = custom_nodes_dir / name / "requirements.txt"
        if req_file.exists():
            print(f"Installing requirements for {name}...")
            run([python, "-m", "pip", "install", "-r", str(req_file)])


def verify_installation():
    """Verify PyTorch can see CUDA."""
    python = get_python()
    print("\nVerifying CUDA availability...")
    result = subprocess.run(
        [python, "-c", "import torch; print(f'PyTorch {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0)}' if torch.cuda.is_available() else 'No GPU detected')"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr)


def main():
    print("=" * 60)
    print("ComfyUI Installation Script")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"ComfyUI dir:  {COMFYUI_DIR}")
    print("=" * 60)

    clone_comfyui()
    install_custom_nodes()
    create_venv()
    install_pytorch()
    install_comfyui_deps()
    install_custom_node_deps()
    verify_installation()

    print("\n" + "=" * 60)
    print("Installation complete!")
    print(f"ComfyUI installed at: {COMFYUI_DIR}")
    print("Run 'start.bat' to launch the application.")
    print("=" * 60)


if __name__ == "__main__":
    main()
