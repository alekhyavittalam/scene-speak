import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-terra";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function apiErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) return { status: 429, message: "SceneSpeak is getting a lot of attention. Wait a moment and try again." };
    if (error.status && error.status >= 500) return { status: 503, message: "The language guide is temporarily unavailable. Please try again." };
  }
  if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
    return { status: 503, message: "Live AI is not configured yet. Try one of the sample lessons." };
  }
  return { status: 500, message: "We couldn't create that lesson. Please try again or use a sample." };
}
