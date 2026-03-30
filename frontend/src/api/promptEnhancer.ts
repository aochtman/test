const ENHANCER_URL = "http://127.0.0.1:8189";

export interface EnhanceResponse {
  enhanced: string;
  original: string;
}

export async function enhancePrompt(prompt: string): Promise<EnhanceResponse> {
  const res = await fetch(`${ENHANCER_URL}/enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error("Prompt enhancer unavailable");
  }
  return res.json();
}

export async function checkEnhancerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ENHANCER_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
