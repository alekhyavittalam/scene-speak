import { savedLessonSchema, type Lesson, type QuizAttempt, type SavedLesson } from "@/lib/schemas";

export const STORAGE_KEY = "scenespeak.saved.v1";

export function readSavedLessons(storage: Pick<Storage, "getItem"> = window.localStorage): SavedLesson[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = savedLessonSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function writeSavedLessons(items: SavedLesson[], storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function toggleSaved(items: SavedLesson[], lesson: Lesson): SavedLesson[] {
  const exists = items.some((item) => item.lesson.id === lesson.id);
  return exists
    ? items.filter((item) => item.lesson.id !== lesson.id)
    : [{ lesson, savedAt: new Date().toISOString(), feedback: null, latestAttempt: null }, ...items];
}

export function updateFeedback(items: SavedLesson[], lesson: Lesson, feedback: SavedLesson["feedback"]): SavedLesson[] {
  const existing = items.some((item) => item.lesson.id === lesson.id);
  const base = existing ? items : toggleSaved(items, lesson);
  return base.map((item) => item.lesson.id === lesson.id ? { ...item, feedback } : item);
}

export function saveAttempt(items: SavedLesson[], lesson: Lesson, latestAttempt: QuizAttempt): SavedLesson[] {
  const existing = items.some((item) => item.lesson.id === lesson.id);
  const base = existing ? items : toggleSaved(items, lesson);
  return base.map((item) => item.lesson.id === lesson.id ? { ...item, latestAttempt } : item);
}

export function scoreQuiz(lesson: Lesson, answers: number[]) {
  return lesson.quiz.reduce((score, question, index) => score + (answers[index] === question.correctIndex ? 1 : 0), 0);
}
