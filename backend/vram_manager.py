"""
VRAM auto-release daemon.
Polls ComfyUI and frees VRAM after idle timeout.
Run in background: pythonw backend/vram_manager.py
"""

import time
import urllib.request
import json
import sys

COMFYUI_URL = "http://127.0.0.1:8188"
IDLE_TIMEOUT = 5 * 60  # 5 minutes
POLL_INTERVAL = 10  # check every 10 seconds
VRAM_THRESHOLD = 0.5 * 1024 * 1024 * 1024  # 0.5GB — below this, nothing to free

last_busy_time = time.time()
was_idle = True


def get_vram_used():
    try:
        req = urllib.request.Request(f"{COMFYUI_URL}/system_stats")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        gpu = data["devices"][0]
        return gpu["vram_total"] - gpu["vram_free"]
    except Exception:
        return -1


def get_queue_size():
    try:
        req = urllib.request.Request(f"{COMFYUI_URL}/queue")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return len(data.get("queue_running", [])) + len(data.get("queue_pending", []))
    except Exception:
        return -1


def free_vram():
    try:
        data = json.dumps({"unload_models": True, "free_memory": True}).encode()
        req = urllib.request.Request(
            f"{COMFYUI_URL}/free",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


def main():
    global last_busy_time, was_idle

    print(f"VRAM manager started (idle timeout: {IDLE_TIMEOUT}s)")

    while True:
        time.sleep(POLL_INTERVAL)

        vram_used = get_vram_used()
        queue = get_queue_size()

        # ComfyUI not running
        if vram_used < 0 or queue < 0:
            continue

        is_busy = queue > 0 or vram_used > VRAM_THRESHOLD

        if is_busy:
            last_busy_time = time.time()
            was_idle = False
        elif not was_idle:
            idle_seconds = time.time() - last_busy_time
            if idle_seconds >= IDLE_TIMEOUT:
                if free_vram():
                    vram_after = get_vram_used()
                    mb_after = vram_after / (1024 * 1024) if vram_after > 0 else 0
                    print(f"Auto-released VRAM after {idle_seconds:.0f}s idle ({mb_after:.0f}MB remaining)")
                was_idle = True


if __name__ == "__main__":
    main()
