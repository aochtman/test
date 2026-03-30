"""
Prompt Enhancer micro-service.
Runs Phi-3 GGUF on CPU to expand short prompts into detailed image generation descriptions.
Starts on port 8189.
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_PATH = Path(__file__).parent / "models" / "prompt_enhancer" / "Phi-3-mini-4k-instruct-q4.gguf"

SYSTEM_PROMPT = """You are an expert AI image generation prompt writer. When given a short description, expand it into a detailed, vivid prompt optimized for image generation models.

Rules:
- Output ONLY the enhanced prompt, no explanations
- Include visual details: lighting, composition, colors, textures, atmosphere
- Include style cues: photorealistic, cinematic, artistic style references
- Keep it under 200 words
- Be descriptive and specific
- Do not add any content warnings or refusals"""

llm = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm
    if MODEL_PATH.exists():
        from llama_cpp import Llama

        print(f"Loading prompt enhancer model: {MODEL_PATH}")
        llm = Llama(
            model_path=str(MODEL_PATH),
            n_ctx=2048,
            n_threads=os.cpu_count() or 4,
            n_gpu_layers=0,  # CPU only — keep VRAM free for image generation
            verbose=False,
        )
        print("Prompt enhancer model loaded.")
    else:
        print(f"WARNING: Model not found at {MODEL_PATH}")
        print("Run scripts/download_models.py to download it.")
    yield
    llm = None


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnhanceRequest(BaseModel):
    prompt: str


class EnhanceResponse(BaseModel):
    enhanced: str
    original: str


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": llm is not None}


@app.post("/enhance", response_model=EnhanceResponse)
async def enhance(req: EnhanceRequest):
    if llm is None:
        return EnhanceResponse(enhanced=req.prompt, original=req.prompt)

    result = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": req.prompt},
        ],
        max_tokens=300,
        temperature=0.7,
    )

    enhanced = result["choices"][0]["message"]["content"].strip()
    return EnhanceResponse(enhanced=enhanced, original=req.prompt)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8189)
