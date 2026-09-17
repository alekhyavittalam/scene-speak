import { describe, expect, it, vi } from "vitest";
import { track } from "@/lib/analytics";

describe("analytics adapter", () => {
  it("is a no-op when PostHog is not configured", async () => {
    const original = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    await expect(track("input_started", { language: "hindi", inputType: "text" })).resolves.toBeUndefined();
    process.env.NEXT_PUBLIC_POSTHOG_KEY = original;
    vi.restoreAllMocks();
  });
});
