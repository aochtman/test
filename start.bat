@echo off
echo ============================================================
echo  AI Image ^& Video Generator - Starting...
echo ============================================================
echo.

:: Check ComfyUI is installed
if not exist "ComfyUI\venv\Scripts\python.exe" (
    echo ERROR: ComfyUI not installed. Run setup.bat first.
    pause
    exit /b 1
)

:: Start ComfyUI headless on port 8188
echo Starting ComfyUI on port 8188...
start "ComfyUI" cmd /c "ComfyUI\venv\Scripts\python.exe ComfyUI\main.py --listen 0.0.0.0 --port 8188 --preview-method auto"

:: Wait for ComfyUI to be ready
echo Waiting for ComfyUI to start...
:wait_comfyui
timeout /t 2 /nobreak >nul
curl -s http://127.0.0.1:8188/system_stats >nul 2>&1
if errorlevel 1 goto wait_comfyui
echo ComfyUI is ready.

:: Start VRAM auto-release manager
echo Starting VRAM manager (auto-releases after 5 min idle)...
start "VRAM Manager" cmd /min /c "python backend\vram_manager.py"

:: Start prompt enhancer if model exists
if exist "backend\models\prompt_enhancer\Phi-3-mini-4k-instruct-q4.gguf" (
    echo Starting prompt enhancer on port 8189...
    start "Prompt Enhancer" cmd /c "python backend\prompt_enhancer.py"
) else (
    echo Prompt enhancer model not found, skipping.
)

:: Start frontend dev server on port 3000
echo Starting frontend on port 3000...
start "Frontend" cmd /c "cd frontend && npm run dev"

:: Wait a moment then open browser
timeout /t 3 /nobreak >nul
echo.
echo ============================================================
echo  App is running!
echo  Frontend: http://localhost:3000
echo  ComfyUI:  http://localhost:8188
echo ============================================================
echo.
echo Opening browser...
start http://localhost:3000

echo Press any key to stop all services...
pause >nul

:: Cleanup: kill the processes
echo Stopping services...
taskkill /fi "windowtitle eq ComfyUI" /f >nul 2>&1
taskkill /fi "windowtitle eq Prompt Enhancer" /f >nul 2>&1
taskkill /fi "windowtitle eq Frontend" /f >nul 2>&1
echo Done.
