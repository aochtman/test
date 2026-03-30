@echo off
echo ============================================================
echo  AI Image ^& Video Generator - Setup
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.11+ from python.org
    pause
    exit /b 1
)

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found. Install Git from git-scm.com
    pause
    exit /b 1
)

:: Check NVIDIA GPU
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo WARNING: nvidia-smi not found. CUDA may not work.
    echo Make sure NVIDIA drivers are installed.
    echo.
)

echo [Step 1/3] Installing ComfyUI and custom nodes...
python scripts\install_comfyui.py
if errorlevel 1 (
    echo ERROR: ComfyUI installation failed.
    pause
    exit /b 1
)

echo.
echo [Step 2/3] Downloading models...
echo This will download ~30GB of model files. Make sure you have enough disk space.
echo.
python scripts\download_models.py
if errorlevel 1 (
    echo WARNING: Some models failed to download. You can re-run this script to retry.
)

echo.
echo [Step 3/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..
if errorlevel 1 (
    echo WARNING: Frontend install failed. Make sure Node.js is installed.
)

echo.
echo ============================================================
echo  Setup complete!
echo  Run 'start.bat' to launch the application.
echo ============================================================
pause
