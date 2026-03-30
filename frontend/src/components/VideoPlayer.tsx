import { useGenerationStore } from "../stores/generationStore";

export default function VideoPlayer() {
  const videos = useGenerationStore((s) => s.videos);

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-dark-400 text-sm">
        Generated videos will appear here
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden"
        >
          <img
            src={video.url}
            alt={video.prompt}
            className="w-full max-h-[60vh] object-contain bg-black"
          />
          <div className="p-3 flex items-center gap-2">
            <p className="flex-1 text-sm text-dark-200 line-clamp-1">
              {video.prompt}
            </p>
            <a
              href={video.url}
              download={video.filename}
              className="px-3 py-1.5 text-xs bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
