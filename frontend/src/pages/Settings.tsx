import { useGenerationStore } from "../stores/generationStore";
import { freeVram } from "../api/comfyui";
import { useState } from "react";

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

export default function Settings() {
  const vramStatus = useGenerationStore((s) => s.vramStatus);
  const idleTimeoutMinutes = useGenerationStore((s) => s.idleTimeoutMinutes);
  const setIdleTimeoutMinutes = useGenerationStore((s) => s.setIdleTimeoutMinutes);
  const checkpoints = useGenerationStore((s) => s.availableCheckpoints);
  const loras = useGenerationStore((s) => s.availableLoras);
  const images = useGenerationStore((s) => s.images);
  const videos = useGenerationStore((s) => s.videos);
  const clearImages = useGenerationStore((s) => s.clearImages);
  const clearVideos = useGenerationStore((s) => s.clearVideos);

  const [releasing, setReleasing] = useState(false);
  const [purging, setPurging] = useState(false);

  async function handleReleaseVram() {
    setReleasing(true);
    try {
      await freeVram();
    } catch (err) {
      console.error("Failed to release VRAM:", err);
    } finally {
      setReleasing(false);
    }
  }

  function handlePurge() {
    if (!confirm("This will clear the gallery. Generated files on disk are not affected. Continue?")) return;
    setPurging(true);
    clearImages();
    clearVideos();
    setPurging(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-dark-50 mb-6">Settings</h2>

      <div className="space-y-6">
        {/* GPU / VRAM */}
        <section className="bg-dark-800 rounded-lg p-5 border border-dark-700">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">GPU & VRAM</h3>

          {vramStatus && vramStatus.total > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-dark-400">Total</p>
                  <p className="text-dark-100 font-medium">{formatBytes(vramStatus.total)}</p>
                </div>
                <div>
                  <p className="text-dark-400">Used</p>
                  <p className="text-dark-100 font-medium">{formatBytes(vramStatus.used)}</p>
                </div>
                <div>
                  <p className="text-dark-400">Free</p>
                  <p className="text-dark-100 font-medium">{formatBytes(vramStatus.free)}</p>
                </div>
              </div>

              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    vramStatus.usedPercent < 5 ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(vramStatus.usedPercent, 100)}%` }}
                />
              </div>

              <button
                onClick={handleReleaseVram}
                disabled={releasing}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:bg-dark-600 rounded-lg transition-colors"
              >
                {releasing ? "Releasing..." : "Release VRAM"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-dark-400">GPU not detected or ComfyUI not running.</p>
          )}
        </section>

        {/* Auto-release */}
        <section className="bg-dark-800 rounded-lg p-5 border border-dark-700">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Auto-Release VRAM</h3>
          <p className="text-sm text-dark-300 mb-3">
            Automatically unload models from VRAM after being idle. Models reload in &lt;1 second
            from NVMe when needed.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-dark-200">Idle timeout:</label>
            <select
              value={idleTimeoutMinutes}
              onChange={(e) => setIdleTimeoutMinutes(parseInt(e.target.value))}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:border-blue-500 focus:outline-none"
            >
              <option value={0}>Disabled</option>
              <option value={2}>2 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </section>

        {/* Installed Models */}
        <section className="bg-dark-800 rounded-lg p-5 border border-dark-700">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Installed Models</h3>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-dark-200 mb-2">
                Checkpoints ({checkpoints.length})
              </h4>
              {checkpoints.length > 0 ? (
                <ul className="space-y-1">
                  {checkpoints.map((c) => (
                    <li key={c} className="text-xs text-dark-300 font-mono bg-dark-700 px-2 py-1 rounded">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-dark-400">No SDXL checkpoints found. Place .safetensors in ComfyUI/models/checkpoints/</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-200 mb-2">
                LoRAs ({loras.length})
              </h4>
              {loras.length > 0 ? (
                <ul className="space-y-1">
                  {loras.map((l) => (
                    <li key={l} className="text-xs text-dark-300 font-mono bg-dark-700 px-2 py-1 rounded">
                      {l}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-dark-400">No LoRAs found. Place .safetensors in ComfyUI/models/loras/</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-dark-200 mb-2">Core Models</h4>
              <ul className="space-y-1 text-xs text-dark-300">
                <li className="bg-dark-700 px-2 py-1 rounded font-mono">Chroma Q8 GGUF — ~12-13GB VRAM</li>
                <li className="bg-dark-700 px-2 py-1 rounded font-mono">Wan 2.2 14B I2V Q4_K_M — ~8-10GB VRAM</li>
                <li className="bg-dark-700 px-2 py-1 rounded font-mono">CogVideoX 1.5 5B FP8 — ~12-14GB VRAM</li>
                <li className="bg-dark-700 px-2 py-1 rounded font-mono">Phi-3 Mini (prompt enhancer) — CPU only</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Gallery / Outputs */}
        <section className="bg-dark-800 rounded-lg p-5 border border-dark-700">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Gallery</h3>
          <p className="text-sm text-dark-300 mb-3">
            {images.length} images, {videos.length} videos in current session gallery.
          </p>
          <div className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg mb-4">
            <p className="text-xs text-yellow-200">
              Use the built-in gallery to view outputs. Opening files directly with Windows Photos
              will add them to the Photos library.
            </p>
          </div>
          <button
            onClick={handlePurge}
            disabled={purging || (images.length === 0 && videos.length === 0)}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:bg-dark-600 disabled:text-dark-400 rounded-lg transition-colors"
          >
            Clear Gallery
          </button>
        </section>
      </div>
    </div>
  );
}
