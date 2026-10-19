import { describe, expect, it } from "vitest";

import { buildTimeline } from "./timeline";

describe("buildTimeline", () => {
  it("lists history oldest first and marks the newest as current", () => {
    const steps = buildTimeline({
      status: "confirmed",
      createdAt: "2026-10-01T00:00:00.000Z",
      history: [
        { to: "confirmed", at: "2026-10-02T09:00:00.000Z" },
        { to: "awaiting_payment", at: "2026-10-01T09:00:00.000Z" },
      ],
    });
    expect(steps.map((s) => s.status)).toEqual(["awaiting_payment", "confirmed"]);
    expect(steps.map((s) => s.current)).toEqual([false, true]);
    expect(steps[1]?.date).toBe("Oct 2, 2026");
    expect(steps[0]?.label).toBe("Waiting for your payment");
  });
  it("keeps repeated statuses", () => {
    const steps = buildTimeline({
      status: "out_for_delivery",
      createdAt: "2026-10-01T00:00:00.000Z",
      history: [
        { to: "out_for_delivery", at: "2026-10-05T00:00:00.000Z" },
        { to: "delivery_failed", at: "2026-10-04T00:00:00.000Z" },
        { to: "out_for_delivery", at: "2026-10-03T00:00:00.000Z" },
      ],
    });
    expect(steps.map((s) => s.status)).toEqual([
      "out_for_delivery",
      "delivery_failed",
      "out_for_delivery",
    ]);
    expect(steps.filter((s) => s.current)).toHaveLength(1);
  });
  it("falls back to the current status when history is empty", () => {
    const steps = buildTimeline({
      status: "packed",
      createdAt: "2026-10-01T00:00:00.000Z",
      history: [],
    });
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ status: "packed", current: true, date: "Oct 1, 2026" });
  });
});
