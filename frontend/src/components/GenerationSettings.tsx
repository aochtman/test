import { useGenerationStore } from "../stores/generationStore";

interface Props {
  showDenoise?: boolean;
  showBatchSize?: boolean;
  showModelSelect?: boolean;
  showVideoSettings?: boolean;
}

const RESOLUTIONS = [
  { label: "512x512", w: 512, h: 512 },
  { label: "768x768", w: 768, h: 768 },
  { label: "1024x1024", w: 1024, h: 1024 },
  { label: "1024x768", w: 1024, h: 768 },
  { label: "768x1024", w: 768, h: 1024 },
  { label: "1280x720", w: 1280, h: 720 },
  { label: "720x1280", w: 720, h: 1280 },
];

export default function GenerationSettings({
  showDenoise = false,
  showBatchSize = true,
  showModelSelect = true,
  showVideoSettings = false,
}: Props) {
  const settings = useGenerationStore((s) => s.settings);
  const updateSettings = useGenerationStore((s) => s.updateSettings);
  const modelType = useGenerationStore((s) => s.modelType);
  const setModelType = useGenerationStore((s) => s.setModelType);
  const checkpoints = useGenerationStore((s) => s.availableCheckpoints);
  const loras = useGenerationStore((s) => s.availableLoras);

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      {showModelSelect && (
        <div>
          <label className="text-sm font-medium text-dark-200 mb-1.5 block">Model</label>
          <div className="flex gap-2">
            <button
              onClick={() => setModelType("chroma")}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                modelType === "chroma"
                  ? "bg-blue-600 text-white"
                  : "bg-dark-700 text-dark-300 hover:bg-dark-600"
              }`}
            >
              Chroma
            </button>
            <button
              onClick={() => setModelType("sd15")}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                modelType === "sd15"
                  ? "bg-blue-600 text-white"
                  : "bg-dark-700 text-dark-300 hover:bg-dark-600"
              }`}
            >
              SD 1.5
            </button>
            <button
              onClick={() => setModelType("sdxl")}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                modelType === "sdxl"
                  ? "bg-blue-600 text-white"
                  : "bg-dark-700 text-dark-300 hover:bg-dark-600"
              }`}
            >
              SDXL
            </button>
          </div>
        </div>
      )}

      {/* Checkpoint + LoRA (SD 1.5 & SDXL) */}
      {showModelSelect && (modelType === "sdxl" || modelType === "sd15") && (
        <>
          <div>
            <label className="text-sm font-medium text-dark-200 mb-1.5 block">Checkpoint</label>
            <select
              value={settings.checkpoint}
              onChange={(e) => updateSettings({ checkpoint: e.target.value })}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select checkpoint...</option>
              {checkpoints.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-200 mb-1.5 block">
              LoRA <span className="text-dark-400 font-normal">(optional)</span>
            </label>
            <select
              value={settings.loraName}
              onChange={(e) => updateSettings({ loraName: e.target.value })}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="">None</option>
              {loras.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {settings.loraName && (
              <div className="mt-2">
                <label className="text-xs text-dark-400">
                  Strength: {settings.loraStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={settings.loraStrength}
                  onChange={(e) => updateSettings({ loraStrength: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Resolution */}
      <div>
        <label className="text-sm font-medium text-dark-200 mb-1.5 block">Resolution</label>
        <select
          value={`${settings.width}x${settings.height}`}
          onChange={(e) => {
            const res = RESOLUTIONS.find((r) => `${r.w}x${r.h}` === e.target.value);
            if (res) updateSettings({ width: res.w, height: res.h });
          }}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:border-blue-500 focus:outline-none"
        >
          {RESOLUTIONS.map((r) => (
            <option key={r.label} value={r.label}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Steps */}
      <div>
        <label className="text-sm font-medium text-dark-200 mb-1.5 block">
          Steps: {settings.steps}
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={settings.steps}
          onChange={(e) => updateSettings({ steps: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* CFG Scale */}
      <div>
        <label className="text-sm font-medium text-dark-200 mb-1.5 block">
          CFG Scale: {settings.cfg.toFixed(1)}
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={settings.cfg}
          onChange={(e) => updateSettings({ cfg: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Denoise */}
      {showDenoise && (
        <div>
          <label className="text-sm font-medium text-dark-200 mb-1.5 block">
            Denoise Strength: {settings.denoise.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.denoise}
            onChange={(e) => updateSettings({ denoise: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {/* Seed */}
      <div>
        <label className="text-sm font-medium text-dark-200 mb-1.5 block">Seed</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={settings.seed}
            onChange={(e) => updateSettings({ seed: parseInt(e.target.value) || -1 })}
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => updateSettings({ seed: -1 })}
            className="px-3 py-2 text-xs bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
            title="Random seed"
          >
            Random
          </button>
        </div>
        <p className="text-xs text-dark-400 mt-1">-1 = random</p>
      </div>

      {/* Batch Size */}
      {showBatchSize && (
        <div>
          <label className="text-sm font-medium text-dark-200 mb-1.5 block">
            Batch Size: {settings.batchSize}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={settings.batchSize}
            onChange={(e) => updateSettings({ batchSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {/* Video Settings */}
      {showVideoSettings && (
        <>
          <div>
            <label className="text-sm font-medium text-dark-200 mb-1.5 block">Video Model</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ videoModel: "wan22" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  settings.videoModel === "wan22"
                    ? "bg-blue-600 text-white"
                    : "bg-dark-700 text-dark-300 hover:bg-dark-600"
                }`}
              >
                Wan 2.2
              </button>
              <button
                onClick={() => updateSettings({ videoModel: "cogvideox" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  settings.videoModel === "cogvideox"
                    ? "bg-blue-600 text-white"
                    : "bg-dark-700 text-dark-300 hover:bg-dark-600"
                }`}
              >
                CogVideoX
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-200 mb-1.5 block">
              Frames: {settings.numFrames}
            </label>
            <input
              type="range"
              min={17}
              max={129}
              step={4}
              value={settings.numFrames}
              onChange={(e) => updateSettings({ numFrames: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-dark-400 mt-1">
              ~{(settings.numFrames / settings.fps).toFixed(1)}s at {settings.fps} FPS
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-200 mb-1.5 block">
              FPS: {settings.fps}
            </label>
            <input
              type="range"
              min={8}
              max={30}
              value={settings.fps}
              onChange={(e) => updateSettings({ fps: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
}
