import { useGenerationStore } from "../stores/generationStore";

export default function ProgressBar() {
  const progress = useGenerationStore((s) => s.progress);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  if (!isGenerating && !progress) return null;

  const percent = progress
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0;

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-dark-200">
          {progress
            ? `Step ${progress.currentStep} / ${progress.totalSteps}`
            : "Preparing..."}
        </span>
        <span className="text-sm text-dark-400">{percent}%</span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
