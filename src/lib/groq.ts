import OpenAI from "openai";

/**
 * Groq exposes an OpenAI-compatible API, so we reuse the OpenAI SDK and just
 * point it at Groq's base URL. Used by the AI Campaign Assistant.
 */
export function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local to use the AI Campaign Assistant."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
