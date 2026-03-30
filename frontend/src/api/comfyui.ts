import type {
  ComfyUIWorkflow,
  QueuePromptResponse,
  ComfyUISystemStats,
  ComfyUIHistory,
  ComfyUIWsMessage,
  VramStatus,
} from "./types";

const COMFYUI_URL = "/api/comfyui";
const COMFYUI_WS = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/comfyui-ws/ws`;

// ── REST API ──

export async function queuePrompt(
  workflow: ComfyUIWorkflow,
  clientId: string
): Promise<QueuePromptResponse> {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to queue prompt: ${err}`);
  }
  return res.json();
}

export async function getHistory(promptId?: string): Promise<ComfyUIHistory> {
  const url = promptId
    ? `${COMFYUI_URL}/history/${promptId}`
    : `${COMFYUI_URL}/history`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function uploadImage(file: File): Promise<{ name: string }> {
  const form = new FormData();
  form.append("image", file);
  form.append("overwrite", "true");
  const res = await fetch(`${COMFYUI_URL}/upload/image`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Failed to upload image");
  return res.json();
}

export async function freeVram(): Promise<void> {
  const res = await fetch(`${COMFYUI_URL}/free`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unload_models: true, free_memory: true }),
  });
  if (!res.ok) throw new Error("Failed to free VRAM");
}

export async function getSystemStats(): Promise<ComfyUISystemStats> {
  const res = await fetch(`${COMFYUI_URL}/system_stats`);
  if (!res.ok) throw new Error("Failed to fetch system stats");
  return res.json();
}

export async function getVramStatus(): Promise<VramStatus> {
  const stats = await getSystemStats();
  const gpu = stats.devices?.[0];
  if (!gpu) {
    return { total: 0, free: 0, used: 0, usedPercent: 0 };
  }
  const total = gpu.vram_total;
  const free = gpu.vram_free;
  const used = total - free;
  return {
    total,
    free,
    used,
    usedPercent: total > 0 ? (used / total) * 100 : 0,
  };
}

export function getImageUrl(filename: string, subfolder: string = "", type: string = "output"): string {
  return `${COMFYUI_URL}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${type}`;
}

export async function getModels(): Promise<{ checkpoints: string[]; loras: string[] }> {
  const [ckptRes, loraRes] = await Promise.all([
    fetch(`${COMFYUI_URL}/object_info/CheckpointLoaderSimple`),
    fetch(`${COMFYUI_URL}/object_info/LoraLoader`),
  ]);

  let checkpoints: string[] = [];
  let loras: string[] = [];

  if (ckptRes.ok) {
    const data = await ckptRes.json();
    checkpoints = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] ?? [];
  }
  if (loraRes.ok) {
    const data = await loraRes.json();
    loras = data?.LoraLoader?.input?.required?.lora_name?.[0] ?? [];
  }

  return { checkpoints, loras };
}

// ── WebSocket ──

export type WsMessageHandler = (msg: ComfyUIWsMessage) => void;

export function connectWebSocket(
  clientId: string,
  onMessage: WsMessageHandler,
  onError?: (err: Event) => void
): WebSocket {
  const ws = new WebSocket(`${COMFYUI_WS}?clientId=${clientId}`);

  ws.onmessage = (event) => {
    try {
      const msg: ComfyUIWsMessage = JSON.parse(event.data);
      onMessage(msg);
    } catch {
      // ignore binary preview frames
    }
  };

  ws.onerror = (err) => {
    console.error("ComfyUI WebSocket error:", err);
    onError?.(err);
  };

  return ws;
}

// ── Workflow Template Engine ──

export function applyWorkflowParams(
  workflow: ComfyUIWorkflow,
  params: Record<string, string | number | boolean>
): ComfyUIWorkflow {
  let json = JSON.stringify(workflow);

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`;
    // Replace string placeholders (quoted in JSON)
    json = json.replaceAll(`"${placeholder}"`, JSON.stringify(value));
    // Replace any remaining unquoted placeholders
    json = json.replaceAll(placeholder, String(value));
  }

  return JSON.parse(json);
}

// ── Workflow Loader ──

const workflowCache = new Map<string, ComfyUIWorkflow>();

export async function loadWorkflow(name: string): Promise<ComfyUIWorkflow> {
  const cached = workflowCache.get(name);
  if (cached) return structuredClone(cached);

  const res = await fetch(`/workflows/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load workflow: ${name}`);
  const workflow: ComfyUIWorkflow = await res.json();
  workflowCache.set(name, workflow);
  return structuredClone(workflow);
}
