import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiProvider = "claude" | "openai" | "gemini";

export interface AiResolution {
  provider: AiProvider;
  apiKey: string;
  model: string;
  free: boolean;
}

// Default models per provider. We default to the latest fast Claude model for the free tier.
const MODELS: Record<AiProvider, string> = {
  claude: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-1.5-flash",
};

/**
 * Decides which provider/key to use: the user's BYO key if present, otherwise the free
 * built-in overview (app FREE_AI_KEY via Claude). Returns null if no AI is available.
 */
export function resolveAi(userProvider: string | null, decryptedKey: string | null): AiResolution | null {
  if (decryptedKey && userProvider && ["claude", "openai", "gemini"].includes(userProvider)) {
    const provider = userProvider as AiProvider;
    return { provider, apiKey: decryptedKey, model: MODELS[provider], free: false };
  }
  const free = process.env.FREE_AI_KEY;
  if (free) {
    return { provider: "claude", apiKey: free, model: MODELS.claude, free: true };
  }
  return null;
}

/** Runs a single prompt and returns text. Used for both coupon and review analysis. */
export async function runAi(res: AiResolution, system: string, prompt: string): Promise<string> {
  if (res.provider === "claude") {
    const client = new Anthropic({ apiKey: res.apiKey });
    const msg = await client.messages.create({
      model: res.model,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
  }

  if (res.provider === "openai") {
    const client = new OpenAI({ apiKey: res.apiKey });
    const completion = await client.chat.completions.create({
      model: res.model,
      max_tokens: 1500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  }

  // gemini
  const genai = new GoogleGenerativeAI(res.apiKey);
  const model = genai.getGenerativeModel({ model: res.model, systemInstruction: system });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** Parses a JSON object out of an AI response that may include prose/code fences. */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
