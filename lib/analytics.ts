import type { Language } from "@/lib/schemas";

export type AnalyticsEvent =
  | "input_started"
  | "lesson_completed"
  | "phrase_saved"
  | "quiz_completed"
  | "quiz_answered"
  | "lesson_feedback";

export type AnalyticsProperties = { language?: Language; inputType?: "text" | "image" | "sample"; lessonId?: string; score?: number; correct?: boolean; feedback?: string };

export async function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  const posthog = (await import("posthog-js")).default;
  if (!posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
    });
  }
  posthog.capture(event, properties);
}
