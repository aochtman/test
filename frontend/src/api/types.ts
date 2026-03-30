// ComfyUI API types

export interface ComfyUIWorkflow {
  [nodeId: string]: {
    class_type: string;
    inputs: Record<string, unknown>;
  };
}

export interface QueuePromptRequest {
  prompt: ComfyUIWorkflow;
  client_id: string;
}

export interface QueuePromptResponse {
  prompt_id: string;
  number: number;
}

export interface ComfyUISystemStats {
  system: {
    os: string;
    python_version: string;
    embedded_python: boolean;
  };
  devices: Array<{
    name: string;
    type: string;
    index: number;
    vram_total: number;
    vram_free: number;
    torch_vram_total: number;
    torch_vram_free: number;
  }>;
}

export interface ComfyUIHistory {
  [promptId: string]: {
    prompt: [number, string, ComfyUIWorkflow, Record<string, unknown>, string[]];
    outputs: Record<
      string,
      {
        images?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
      }
    >;
    status: {
      status_str: string;
      completed: boolean;
    };
  };
}

// WebSocket message types
export type ComfyUIWsMessage =
  | { type: "status"; data: { status: { exec_info: { queue_remaining: number } } } }
  | { type: "execution_start"; data: { prompt_id: string } }
  | { type: "execution_cached"; data: { prompt_id: string; nodes: string[] } }
  | { type: "executing"; data: { node: string | null; prompt_id: string } }
  | { type: "progress"; data: { value: number; max: number; prompt_id: string; node: string } }
  | { type: "executed"; data: { node: string; prompt_id: string; output: Record<string, unknown> } }
  | { type: "execution_error"; data: { prompt_id: string; node_id: string; exception_message: string } };

// Generation types
export type GenerationMode = "txt2img" | "img2img" | "img2vid";
export type ModelType = "chroma" | "sdxl";
export type VideoModel = "wan22" | "cogvideox";

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  seed: number;
  batchSize: number;
  denoise: number;
  // SDXL-specific
  checkpoint: string;
  loraName: string;
  loraStrength: number;
  // Video-specific
  numFrames: number;
  fps: number;
  videoModel: VideoModel;
}

export interface GeneratedImage {
  id: string;
  filename: string;
  subfolder: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  filename: string;
  subfolder: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: number;
}

export interface GenerationProgress {
  promptId: string;
  currentStep: number;
  totalSteps: number;
  currentNode: string;
  isRunning: boolean;
}

export interface VramStatus {
  total: number;
  free: number;
  used: number;
  usedPercent: number;
}
