import { create } from "zustand";
import type {
  GenerationSettings,
  GeneratedImage,
  GeneratedVideo,
  GenerationProgress,
  VramStatus,
  ModelType,
  VideoModel,
} from "../api/types";

interface GenerationStore {
  // Settings
  settings: GenerationSettings;
  updateSettings: (partial: Partial<GenerationSettings>) => void;
  resetSettings: () => void;

  // Model selection
  modelType: ModelType;
  setModelType: (model: ModelType) => void;
  availableCheckpoints: string[];
  availableLoras: string[];
  setAvailableModels: (checkpoints: string[], loras: string[]) => void;

  // Generation state
  progress: GenerationProgress | null;
  setProgress: (progress: GenerationProgress | null) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // Gallery
  images: GeneratedImage[];
  addImage: (image: GeneratedImage) => void;
  clearImages: () => void;
  videos: GeneratedVideo[];
  addVideo: (video: GeneratedVideo) => void;
  clearVideos: () => void;

  // VRAM
  vramStatus: VramStatus | null;
  setVramStatus: (status: VramStatus | null) => void;
  idleTimeoutMinutes: number;
  setIdleTimeoutMinutes: (minutes: number) => void;
  lastGenerationTime: number;
  setLastGenerationTime: (time: number) => void;

  // Prompt enhancer
  enhancerAvailable: boolean;
  setEnhancerAvailable: (v: boolean) => void;
  enhancerEnabled: boolean;
  setEnhancerEnabled: (v: boolean) => void;

  // Input image (for img2img / img2vid)
  inputImageFile: File | null;
  inputImagePreview: string | null;
  setInputImage: (file: File | null) => void;
  useGalleryImage: (image: GeneratedImage) => void;
  selectedGalleryImage: GeneratedImage | null;
}

const DEFAULT_SETTINGS: GenerationSettings = {
  prompt: "",
  negativePrompt: "",
  width: 1024,
  height: 1024,
  steps: 4,
  cfg: 1.0,
  seed: -1,
  batchSize: 1,
  denoise: 0.7,
  checkpoint: "",
  loraName: "",
  loraStrength: 0.8,
  numFrames: 81,
  fps: 16,
  videoModel: "wan22",
};

export const useGenerationStore = create<GenerationStore>((set) => ({
  // Settings
  settings: { ...DEFAULT_SETTINGS },
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
  resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

  // Model selection
  modelType: "chroma",
  setModelType: (modelType) => {
    const defaults: Partial<GenerationSettings> =
      modelType === "chroma"
        ? { steps: 4, cfg: 1.0, width: 1024, height: 1024 }
        : modelType === "sd15"
        ? { steps: 25, cfg: 7.0, width: 512, height: 768 }
        : { steps: 25, cfg: 7.0, width: 1024, height: 1024 };
    set((state) => ({
      modelType,
      settings: { ...state.settings, ...defaults },
    }));
  },
  availableCheckpoints: [],
  availableLoras: [],
  setAvailableModels: (checkpoints, loras) =>
    set({ availableCheckpoints: checkpoints, availableLoras: loras }),

  // Generation state
  progress: null,
  setProgress: (progress) => set({ progress }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  // Gallery
  images: [],
  addImage: (image) =>
    set((state) => ({ images: [image, ...state.images] })),
  clearImages: () => set({ images: [] }),
  videos: [],
  addVideo: (video) =>
    set((state) => ({ videos: [video, ...state.videos] })),
  clearVideos: () => set({ videos: [] }),

  // VRAM
  vramStatus: null,
  setVramStatus: (vramStatus) => set({ vramStatus }),
  idleTimeoutMinutes: 5,
  setIdleTimeoutMinutes: (idleTimeoutMinutes) => set({ idleTimeoutMinutes }),
  lastGenerationTime: 0,
  setLastGenerationTime: (lastGenerationTime) => set({ lastGenerationTime }),

  // Prompt enhancer
  enhancerAvailable: false,
  setEnhancerAvailable: (enhancerAvailable) => set({ enhancerAvailable }),
  enhancerEnabled: false,
  setEnhancerEnabled: (enhancerEnabled) => set({ enhancerEnabled }),

  // Input image
  inputImageFile: null,
  inputImagePreview: null,
  setInputImage: (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      set({ inputImageFile: file, inputImagePreview: url, selectedGalleryImage: null });
    } else {
      set({ inputImageFile: null, inputImagePreview: null, selectedGalleryImage: null });
    }
  },
  useGalleryImage: (image) =>
    set({ selectedGalleryImage: image, inputImageFile: null, inputImagePreview: image.url }),
  selectedGalleryImage: null,
}));
