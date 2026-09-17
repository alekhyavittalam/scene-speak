import { NextResponse } from "next/server";
import { lessonRequestSchema, lessonSchema, openAiLessonJsonSchema } from "@/lib/schemas";
import { apiErrorMessage, getOpenAI, MODEL } from "@/lib/server/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = lessonRequestSchema.parse(await request.json());
    const languageRules = input.language === "hindi"
      ? "Preserve or restore Devanagari when appropriate. pronunciationLabel must be Transliteration and pronunciation must be readable Latin-script transliteration."
      : "Preserve French accents and apostrophes. pronunciationLabel must be Pronunciation and pronunciation must be concise English-friendly guidance without IPA.";

    const response = await getOpenAI().responses.create({
      model: MODEL,
      instructions: `You are SceneSpeak, a culturally careful language coach for English-speaking learners. Explain how a short ${input.language} movie phrase is actually used. Prioritize pragmatic tone and safe usage over textbook grammar. Do not invent a movie source. Keep every field concise and concrete. ${languageRules} Create exactly three multiple-choice questions in this order: natural meaning, tone, and appropriate real-world usage. Each has exactly three distinct options and one correct answer.`,
      input: `Create a SceneSpeak lesson for this ${input.language} phrase: ${input.phrase}`,
      text: {
        format: {
          type: "json_schema",
          name: "scenespeak_lesson",
          strict: true,
          schema: openAiLessonJsonSchema,
        },
      },
    });

    const generated = JSON.parse(response.output_text);
    const lesson = lessonSchema.parse({
      ...generated,
      id: crypto.randomUUID(),
      language: input.language,
      original: input.phrase,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(lesson);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Enter one phrase of 200 characters or fewer." }, { status: 400 });
    }
    const apiError = apiErrorMessage(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
