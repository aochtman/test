import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  connectWebSocket,
  queuePrompt,
  loadWorkflow,
  applyWorkflowParams,
  uploadImage,
  getImageUrl,
  getModels,
} from "../api/comfyui";
import type { ComfyUIWsMessage, GeneratedImage, GenerationMode, ModelType } from "../api/types";
import { useGenerationStore } from "../stores/generationStore";

export function useComfyUI() {
  const clientId = useRef(uuidv4());
  const wsRef = useRef<WebSocket | null>(null);
  const store = useGenerationStore();

  // Connect WebSocket on mount
  useEffect(() => {
    function handleMessage(msg: ComfyUIWsMessage) {
      switch (msg.type) {
        case "progress":
          store.setProgress({
            promptId: msg.data.prompt_id,
            currentStep: msg.data.value,
            totalSteps: msg.data.max,
            currentNode: msg.data.node,
            isRunning: true,
          });
          break;

        case "executed": {
          const output = msg.data.output;
          const images = (output as Record<string, unknown>)?.images as
            | Array<{ filename: string; subfolder: string }>
            | undefined;
          if (images) {
            for (const img of images) {
              store.addImage({
                id: uuidv4(),
                filename: img.filename,
                subfolder: img.subfolder,
                url: getImageUrl(img.filename, img.subfolder),
                prompt: store.settings.prompt,
                model: store.modelType,
                timestamp: Date.now(),
              });
            }
          }
          break;
        }

        case "executing":
          if (msg.data.node === null) {
            // Execution finished
            store.setProgress(null);
            store.setIsGenerating(false);
            store.setLastGenerationTime(Date.now());
          }
          break;

        case "execution_error":
          console.error("Execution error:", msg.data.exception_message);
          store.setProgress(null);
          store.setIsGenerating(false);
          break;
      }
    }

    wsRef.current = connectWebSocket(clientId.current, handleMessage);

    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Load available models
  useEffect(() => {
    getModels()
      .then(({ checkpoints, loras }) => store.setAvailableModels(checkpoints, loras))
      .catch(console.error);
  }, []);

  const generate = useCallback(
    async (mode: GenerationMode) => {
      const { settings, modelType } = useGenerationStore.getState();
      store.setIsGenerating(true);

      try {
        // Pick the right workflow
        let workflowName: string;
        if (mode === "txt2img") {
          workflowName = modelType === "chroma" ? "txt2img_chroma" : modelType === "sd15" ? "txt2img_sd15" : "txt2img_sdxl";
        } else if (mode === "img2img") {
          workflowName = modelType === "chroma" ? "img2img_chroma" : "img2img_sdxl";
        } else {
          workflowName = settings.videoModel === "wan22" ? "img2vid_wan22" : "img2vid_cogvideox";
        }

        const workflow = await loadWorkflow(workflowName);

        // Handle input image upload for img2img / img2vid
        let inputImageName = "";
        const { inputImageFile, selectedGalleryImage } = useGenerationStore.getState();
        if (mode !== "txt2img") {
          if (inputImageFile) {
            const uploaded = await uploadImage(inputImageFile);
            inputImageName = uploaded.name;
          } else if (selectedGalleryImage) {
            inputImageName = selectedGalleryImage.filename;
          }
        }

        // Build params
        const seed = settings.seed === -1 ? Math.floor(Math.random() * 2 ** 32) : settings.seed;
        const params: Record<string, string | number | boolean> = {
          prompt: settings.prompt,
          negative_prompt: settings.negativePrompt,
          width: settings.width,
          height: settings.height,
          steps: settings.steps,
          cfg: settings.cfg,
          seed,
          batch_size: settings.batchSize,
          denoise: settings.denoise,
          input_image: inputImageName,
          // SDXL
          checkpoint: settings.checkpoint,
          lora_name: settings.loraName,
          lora_strength: settings.loraStrength,
          // Video
          num_frames: settings.numFrames,
          fps: settings.fps,
        };

        const finalWorkflow = applyWorkflowParams(workflow, params);
        await queuePrompt(finalWorkflow, clientId.current);
      } catch (err) {
        console.error("Generation failed:", err);
        store.setIsGenerating(false);
      }
    },
    []
  );

  return { generate, clientId: clientId.current };
}
