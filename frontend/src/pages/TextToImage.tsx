import { useEffect } from "react";
import { useComfyUI } from "../hooks/useComfyUI";
import { useGenerationStore } from "../stores/generationStore";
import { checkEnhancerHealth } from "../api/promptEnhancer";
import PromptInput from "../components/PromptInput";
import GenerationSettings from "../components/GenerationSettings";
import ProgressBar from "../components/ProgressBar";
import ImageGallery from "../components/ImageGallery";

export default function TextToImage() {
  const { generate } = useComfyUI();
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const modelType = useGenerationStore((s) => s.modelType);
  const setEnhancerAvailable = useGenerationStore((s) => s.setEnhancerAvailable);

  useEffect(() => {
    checkEnhancerHealth().then(setEnhancerAvailable);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-dark-50 mb-6">Text to Image</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <PromptInput showNegative={modelType !== "chroma"} />
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <GenerationSettings showModelSelect showBatchSize />
          </div>

          <button
            onClick={() => generate("txt2img")}
            disabled={isGenerating}
            className="w-full py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-dark-600 disabled:text-dark-400 rounded-lg transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>

          <ProgressBar />
        </div>

        {/* Right: Gallery */}
        <div className="lg:col-span-2">
          <ImageGallery />
        </div>
      </div>
    </div>
  );
}
