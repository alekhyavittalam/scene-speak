import { describe, expect, it } from "vitest";
import { sampleLessons } from "@/lib/fixtures";
import { readSavedLessons, scoreQuiz, STORAGE_KEY, toggleSaved, updateFeedback, writeSavedLessons } from "@/lib/storage";

describe("saved lesson storage", () => {
  it("saves and removes the same lesson", () => {
    const saved = toggleSaved([], sampleLessons.hindi);
    expect(saved).toHaveLength(1);
    expect(toggleSaved(saved, sampleLessons.hindi)).toHaveLength(0);
  });

  it("round-trips valid records", () => {
    let value: string | null = null;
    const storage = {
      getItem: (key: string) => key === STORAGE_KEY ? value : null,
      setItem: (_key: string, next: string) => { value = next; },
    };
    const records = updateFeedback(toggleSaved([], sampleLessons.french), sampleLessons.french, "helpful");
    writeSavedLessons(records, storage);
    expect(readSavedLessons(storage)[0].feedback).toBe("helpful");
  });

  it("drops malformed records instead of crashing", () => {
    expect(readSavedLessons({ getItem: () => '[{"bad":true}]' })).toEqual([]);
  });
});

describe("quiz scoring", () => {
  it("scores each matching answer", () => {
    expect(scoreQuiz(sampleLessons.hindi, [0, 1, 2])).toBe(3);
    expect(scoreQuiz(sampleLessons.hindi, [1, 1, 0])).toBe(1);
  });
});
