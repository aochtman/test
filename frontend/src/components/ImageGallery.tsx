import { useState } from "react";
import { useGenerationStore } from "../stores/generationStore";
import type { GeneratedImage } from "../api/types";

interface Props {
  onUseImage?: (image: GeneratedImage) => void;
}

export default function ImageGallery({ onUseImage }: Props) {
  const images = useGenerationStore((s) => s.images);
  const [selected, setSelected] = useState<GeneratedImage | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-dark-400 text-sm">
        Generated images will appear here
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden bg-dark-800 border border-dark-700 hover:border-dark-500 transition-colors"
            onClick={() => setSelected(img)}
          >
            <img
              src={img.url}
              alt={img.prompt}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.url}
              alt={selected.prompt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 flex items-center gap-2">
              <p className="flex-1 text-sm text-dark-200 line-clamp-2">
                {selected.prompt}
              </p>
              {onUseImage && (
                <button
                  onClick={() => {
                    onUseImage(selected);
                    setSelected(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                >
                  Use as Input
                </button>
              )}
              <a
                href={selected.url}
                download={selected.filename}
                className="px-3 py-1.5 text-xs bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
              >
                Download
              </a>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 text-xs bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
