import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";

import { cameraDistance, placeCamera } from "./camera";
import { CAMERA, POSTER_VIEWBOX } from "./constants";

describe("cameraDistance", () => {
  const posterAspect = POSTER_VIEWBOX.w / POSTER_VIEWBOX.h;

  it("fits the poster height when the viewport is wide enough", () => {
    const wide = cameraDistance(2);
    expect(wide).toBeCloseTo(cameraDistance(posterAspect), 6);
    expect(cameraDistance(3)).toBeCloseTo(wide, 6);
  });

  it("backs away to fit the poster width in a narrow viewport", () => {
    expect(cameraDistance(0.5)).toBeGreaterThan(cameraDistance(posterAspect));
    expect(cameraDistance(0.25)).toBeCloseTo(cameraDistance(0.5) * 2, 6);
  });

  it("is finite for a zero-sized viewport", () => {
    expect(Number.isFinite(cameraDistance(0))).toBe(true);
  });
});

describe("placeCamera", () => {
  it("keeps the requested distance and looks at the origin", () => {
    const camera = new PerspectiveCamera(CAMERA.fov);
    placeCamera(camera, 0.1, 0.2, 12);
    expect(camera.position.length()).toBeCloseTo(12, 6);
    expect(camera.position.y).toBeGreaterThan(0);
  });
});
