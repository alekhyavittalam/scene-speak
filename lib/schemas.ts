import { z } from "zod";

export const languageSchema = z.enum(["hindi", "french"]);
export type Language = z.infer<typeof languageSchema>;

export const vocabularyItemSchema = z.object({
  term: z.string().min(1),
  meaning: z.string().min(1),
});

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["meaning", "tone", "usage"]),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(3),
  correctIndex: z.number().int().min(0).max(2),
  explanation: z.string().min(1),
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  language: languageSchema,
  original: z.string().min(1).max(200),
  naturalMeaning: z.string().min(1),
  literalTranslation: z.string().min(1),
  pronunciation: z.string().min(1),
  pronunciationLabel: z.enum(["Transliteration", "Pronunciation"]),
  toneLabels: z.array(z.string().min(1)).min(1).max(4),
  toneExplanation: z.string().min(1),
  whenToUse: z.string().min(1),
  whenNotToUse: z.string().min(1),
  vocabulary: z.array(vocabularyItemSchema).min(2).max(5),
  similarExpression: z.object({
    phrase: z.string().min(1),
    meaning: z.string().min(1),
    distinction: z.string().min(1),
  }),
  quiz: z.array(quizQuestionSchema).length(3),
  createdAt: z.string().datetime(),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const lessonRequestSchema = z.object({
  language: languageSchema,
  phrase: z.string().trim().min(1, "Enter a phrase first.").max(200, "Keep it under 200 characters."),
});

export const extractionResponseSchema = z.object({
  extractedText: z.string(),
  confidenceWarning: z.string().optional(),
});

export const quizAttemptSchema = z.object({
  lessonId: z.string(),
  answers: z.array(z.number().int().min(0).max(2)).length(3),
  score: z.number().int().min(0).max(3),
  completedAt: z.string().datetime(),
});
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

export const savedLessonSchema = z.object({
  lesson: lessonSchema,
  savedAt: z.string().datetime(),
  feedback: z.enum(["helpful", "not_helpful"]).nullable().default(null),
  latestAttempt: quizAttemptSchema.nullable().default(null),
});
export type SavedLesson = z.infer<typeof savedLessonSchema>;

export const openAiLessonJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "naturalMeaning", "literalTranslation", "pronunciation", "pronunciationLabel",
    "toneLabels", "toneExplanation", "whenToUse", "whenNotToUse", "vocabulary",
    "similarExpression", "quiz"
  ],
  properties: {
    naturalMeaning: { type: "string" },
    literalTranslation: { type: "string" },
    pronunciation: { type: "string" },
    pronunciationLabel: { type: "string", enum: ["Transliteration", "Pronunciation"] },
    toneLabels: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    toneExplanation: { type: "string" },
    whenToUse: { type: "string" },
    whenNotToUse: { type: "string" },
    vocabulary: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "object", additionalProperties: false, required: ["term", "meaning"], properties: { term: { type: "string" }, meaning: { type: "string" } } }
    },
    similarExpression: {
      type: "object", additionalProperties: false, required: ["phrase", "meaning", "distinction"],
      properties: { phrase: { type: "string" }, meaning: { type: "string" }, distinction: { type: "string" } }
    },
    quiz: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "type", "prompt", "options", "correctIndex", "explanation"],
        properties: {
          id: { type: "string" }, type: { type: "string", enum: ["meaning", "tone", "usage"] },
          prompt: { type: "string" }, options: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
          correctIndex: { type: "integer", minimum: 0, maximum: 2 }, explanation: { type: "string" }
        }
      }
    }
  }
} as const;
