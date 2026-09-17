import { NextResponse } from "next/server";
import { extractionResponseSchema, languageSchema } from "@/lib/schemas";
import { apiErrorMessage, getOpenAI, MODEL } from "@/lib/server/openai";

export const runtime = "nodejs";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const language = languageSchema.parse(form.get("language"));
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Choose a subtitle screenshot first." }, { status: 400 });
    if (!ALLOWED_TYPES.has(image.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 415 });
    if (image.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Keep screenshots under 5 MB." }, { status: 413 });

    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const targetLanguageRules = language === "hindi"
      ? "Translate it into natural, conversational Hindi in Devanagari. Prefer what a Hindi speaker would actually say over a word-for-word translation."
      : "Translate it into natural, conversational French. Preserve French accents and apostrophes, and prefer idiomatic speech over a word-for-word translation.";
    const response = await getOpenAI().responses.create({
      model: MODEL,
      instructions: `Read the primary visible English subtitle in the image, ignoring logos, timestamps, captions, and interface text. ${targetLanguageRules} Return that ${language} translation in extractedText so the learner can edit and confirm it before creating a lesson. If the English line is ambiguous, still provide the most likely translation and briefly explain the uncertainty in confidenceWarning. If no clear English subtitle is visible, return an empty extractedText and a short confidenceWarning.`,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: `Turn the visible English subtitle into a natural ${language} phrase for the user to confirm.` },
          { type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "high" },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "subtitle_extraction",
          strict: true,
          schema: {
            type: "object", additionalProperties: false, required: ["extractedText", "confidenceWarning"],
            properties: { extractedText: { type: "string" }, confidenceWarning: { type: "string" } },
          },
        },
      },
    });
    const result = extractionResponseSchema.parse(JSON.parse(response.output_text));
    if (!result.extractedText.trim()) return NextResponse.json({ error: result.confidenceWarning || "We couldn't find a clear subtitle in that image." }, { status: 422 });
    return NextResponse.json(result);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Choose Hindi or French and upload a valid screenshot." }, { status: 400 });
    }
    const apiError = apiErrorMessage(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
