import { describe, expect, it } from "vitest";
import { sampleLessons } from "@/lib/fixtures";
import { lessonSchema } from "@/lib/schemas";

describe("lesson schema", () => {
  it("accepts the complete Hindi fixture", () => {
    expect(lessonSchema.parse(sampleLessons.hindi).pronunciationLabel).toBe("Transliteration");
  });

  it("accepts the complete French fixture with accents", () => {
    const result = lessonSchema.parse(sampleLessons.french);
    expect(result.pronunciationLabel).toBe("Pronunciation");
    expect(result.similarExpression.phrase).toContain("C'est");
  });

  it("rejects a lesson without exactly three quiz questions", () => {
    const malformed = { ...sampleLessons.hindi, quiz: sampleLessons.hindi.quiz.slice(0, 2) };
    expect(lessonSchema.safeParse(malformed).success).toBe(false);
  });
});
