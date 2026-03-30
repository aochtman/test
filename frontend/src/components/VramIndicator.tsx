import { useGenerationStore } from "../stores/generationStore";
import { freeVram } from "../api/comfyui";

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

export default function VramIndicator() {
  const vramStatus = useGenerationStore((s) => s.vramStatus);

  async function handleRelease() {
    try {
      await freeVram();
    } catch (err) {
      console.error("Failed to release VRAM:", err);
    }
  }

  if (!vramStatus || vramStatus.total === 0) {
    return (
      <div className="px-3 py-2 text-xs text-dark-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-dark-500" />
          GPU: Offline
        </div>
      </div>
    );
  }

  const isLow = vramStatus.usedPercent < 5;

  return (
    <div className="px-3 py-2 text-xs">
      <div className="flex items-center gap-2 text-dark-200">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isLow ? "bg-green-500" : "bg-red-500"
          }`}
        />
        VRAM: {formatBytes(vramStatus.used)} / {formatBytes(vramStatus.total)}
      </div>
      <div className="mt-1.5 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${Math.min(vramStatus.usedPercent, 100)}%` }}
        />
      </div>
      {!isLow && (
        <button
          onClick={handleRelease}
          className="mt-2 w-full px-2 py-1 text-xs bg-dark-600 hover:bg-dark-500 rounded transition-colors"
        >
          Release VRAM
        </button>
      )}
    </div>
  );
}
