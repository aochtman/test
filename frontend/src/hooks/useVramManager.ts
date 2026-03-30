import { useEffect, useRef } from "react";
import { getVramStatus, freeVram } from "../api/comfyui";
import { useGenerationStore } from "../stores/generationStore";

const POLL_INTERVAL_MS = 10_000; // Poll VRAM status every 10 seconds

export function useVramManager() {
  const setVramStatus = useGenerationStore((s) => s.setVramStatus);
  const idleTimeoutMinutes = useGenerationStore((s) => s.idleTimeoutMinutes);
  const lastGenerationTime = useGenerationStore((s) => s.lastGenerationTime);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const autoReleasedRef = useRef(false);

  // Poll VRAM status
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      try {
        const status = await getVramStatus();
        setVramStatus(status);
      } catch {
        setVramStatus(null);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [setVramStatus]);

  // Auto-release VRAM after idle timeout
  useEffect(() => {
    if (isGenerating || lastGenerationTime === 0 || idleTimeoutMinutes <= 0) {
      autoReleasedRef.current = false;
      return;
    }

    const timeoutMs = idleTimeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - lastGenerationTime;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0 && !autoReleasedRef.current) {
      autoReleasedRef.current = true;
      freeVram().catch(console.error);
      return;
    }

    if (remaining > 0) {
      const timer = setTimeout(() => {
        autoReleasedRef.current = true;
        freeVram().catch(console.error);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, lastGenerationTime, idleTimeoutMinutes]);
}
