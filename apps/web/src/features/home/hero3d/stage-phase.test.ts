import { describe, expect, it } from "vitest";

import { nextStagePhase, posterForeground } from "./stage-phase";
import type { StagePhase } from "./stage-phase";

const ALL: StagePhase[] = ["pending", "loading", "live", "static"];

describe("nextStagePhase", () => {
  it("goes pending, loading, live on the happy path", () => {
    let phase: StagePhase = "pending";
    phase = nextStagePhase(phase, { type: "reduced-motion", reduced: false });
    expect(phase).toBe("pending");
    phase = nextStagePhase(phase, { type: "arm" });
    expect(phase).toBe("loading");
    phase = nextStagePhase(phase, { type: "first-frame" });
    expect(phase).toBe("live");
    expect(nextStagePhase(phase, { type: "timeout" })).toBe("live");
  });

  it("shows the static composition for reduced motion, no WebGL or a failure, from any phase", () => {
    for (const phase of ALL) {
      expect(nextStagePhase(phase, { type: "reduced-motion", reduced: true })).toBe("static");
      expect(nextStagePhase(phase, { type: "no-webgl" })).toBe("static");
      expect(nextStagePhase(phase, { type: "fail" })).toBe("static");
    }
  });

  it("gives up on a scene that never drew, but never interrupts a live one", () => {
    expect(nextStagePhase("loading", { type: "timeout" })).toBe("static");
    expect(nextStagePhase("pending", { type: "timeout" })).toBe("pending");
  });

  it("never leaves static on its own", () => {
    for (const event of [{ type: "arm" }, { type: "first-frame" }, { type: "timeout" }] as const) {
      expect(nextStagePhase("static", event)).toBe("static");
    }
    expect(nextStagePhase("static", { type: "reduced-motion", reduced: false })).toBe("static");
  });

  it("ignores a first frame before the scene was armed", () => {
    expect(nextStagePhase("pending", { type: "first-frame" })).toBe("pending");
  });
});

describe("posterForeground", () => {
  it("keeps the stage empty until the scene lands, unless motion is reduced", () => {
    expect(posterForeground("pending")).toBe("auto");
    expect(posterForeground("loading")).toBe("hide");
    expect(posterForeground("live")).toBe("hide");
    expect(posterForeground("static")).toBe("show");
  });
});
