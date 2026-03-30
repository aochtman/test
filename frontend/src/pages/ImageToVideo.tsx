import { useCallback } from "react";
import { useComfyUI } from "../hooks/useComfyUI";
import { useGenerationStore } from "../stores/generationStore";
import PromptInput from "../components/PromptInput";
import GenerationSettings from "../components/GenerationSettings";
import ProgressBar from "../components/ProgressBar";
import VideoPlayer from "../components/VideoPlayer";
import ImageGallery from "../components/ImageGallery";
import type { GeneratedImage } from "../api/types";

export default function ImageToVideo() {
  const { generate } = useComfyUI();
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const setInputImage = useGenerationStore((s) => s.setInputImage);
  const useGalleryImage = useGenerationStore((s) => s.useGalleryImage);
  const inputImagePreview = useGenerationStore((s) => s.inputImagePreview);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        setInputImage(file);
      }
    },
    [setInputImage]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setInputImage(file);
    },
    [setInputImage]
  );

  const handleUseFromGallery = useCallback(
    (image: GeneratedImage) => {
      useGalleryImage(image);
    },
    [useGalleryImage]
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-dark-50 mb-6">Image to Video</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Source Image */}
          <div
            className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {inputImagePreview ? (
              <div className="relative">
                <img
                  src={inputImagePreview}
                  alt="Source"
                  className="w-full aspect-video object-contain bg-dark-900"
                />
                <button
                  onClick={() => setInputImage(null)}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-dark-800/80 hover:bg-dark-700 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-dark-700/50 transition-colors">
                <p className="text-sm text-dark-300">
                  Drop a source image or click to upload
                </p>
                <p className="text-xs text-dark-400 mt-1">
                  Or select from gallery below
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <PromptInput />
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <GenerationSettings
              showModelSelect={false}
              showBatchSize={false}
              showVideoSettings
            />
          </div>

          <button
            onClick={() => generate("img2vid")}
            disabled={isGenerating || !inputImagePreview}
            className="w-full py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-dark-600 disabled:text-dark-400 rounded-lg transition-colors"
          >
            {isGenerating ? "Generating..." : !inputImagePreview ? "Upload a source image first" : "Generate Video"}
          </button>

          <ProgressBar />
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-3">Generated Videos</h3>
            <VideoPlayer />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-dark-100 mb-3">Select Source from Gallery</h3>
            <ImageGallery onUseImage={handleUseFromGallery} />
          </div>
        </div>
      </div>
    </div>
  );
}
