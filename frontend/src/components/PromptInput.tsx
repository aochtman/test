import { useState } from "react";
import { useGenerationStore } from "../stores/generationStore";
import { enhancePrompt } from "../api/promptEnhancer";

interface Props {
  showNegative?: boolean;
}

export default function PromptInput({ showNegative = false }: Props) {
  const settings = useGenerationStore((s) => s.settings);
  const updateSettings = useGenerationStore((s) => s.updateSettings);
  const enhancerAvailable = useGenerationStore((s) => s.enhancerAvailable);
  const enhancerEnabled = useGenerationStore((s) => s.enhancerEnabled);
  const setEnhancerEnabled = useGenerationStore((s) => s.setEnhancerEnabled);
  const [isEnhancing, setIsEnhancing] = useState(false);

  async function handleEnhance() {
    if (!settings.prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const result = await enhancePrompt(settings.prompt);
      updateSettings({ prompt: result.enhanced });
    } catch (err) {
      console.error("Enhancement failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-dark-200">Prompt</label>
          {enhancerAvailable && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-dark-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancerEnabled}
                  onChange={(e) => setEnhancerEnabled(e.target.checked)}
                  className="rounded"
                />
                Auto-enhance
              </label>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !settings.prompt.trim()}
                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-dark-600 disabled:text-dark-400 rounded transition-colors"
              >
                {isEnhancing ? "Enhancing..." : "Enhance"}
              </button>
            </div>
          )}
        </div>
        <textarea
          value={settings.prompt}
          onChange={(e) => updateSettings({ prompt: e.target.value })}
          placeholder="Describe what you want to generate..."
          rows={3}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:border-blue-500 focus:outline-none resize-y"
        />
      </div>

      {showNegative && (
        <div>
          <label className="text-sm font-medium text-dark-200 mb-1.5 block">
            Negative Prompt
          </label>
          <textarea
            value={settings.negativePrompt}
            onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
            placeholder="What to avoid..."
            rows={2}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:border-blue-500 focus:outline-none resize-y"
          />
        </div>
      )}
    </div>
  );
}
