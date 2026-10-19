import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import {
  computePlacements,
  FULL_SCENE,
  ITEM_BASE_SIZE,
  LAYOUT_TYPES,
  packagingSceneBounds,
  SCENE_SIZE,
  sceneBounds,
} from "./index";

describe("sceneBounds", () => {
  it("is the full square for unknown layouts and layouts without a crop", () => {
    expect(FULL_SCENE).toEqual({ x: 0, y: 0, width: SCENE_SIZE, height: SCENE_SIZE });
    expect(sceneBounds("box-grid")).toEqual(FULL_SCENE);
    expect(sceneBounds("not-a-layout")).toEqual(FULL_SCENE);
    expect(sceneBounds("toString")).toEqual(FULL_SCENE);
  });

  it("crops the bouquet to the lower part of the square", () => {
    const fan = sceneBounds("bouquet-fan");
    expect(fan.y).toBeGreaterThan(0);
    expect(fan.height).toBeLessThan(SCENE_SIZE);
    expect(fan.width).toBeGreaterThan(fan.height);
  });

  it("shows the full square when the packaging has uploaded layer images", () => {
    for (const layoutType of LAYOUT_TYPES) {
      expect(sceneBounds(layoutType, true)).toEqual(FULL_SCENE);
    }
  });

  it("keeps every crop inside the scene square", () => {
    for (const layoutType of LAYOUT_TYPES) {
      const b = sceneBounds(layoutType);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
      expect(b.x + b.width).toBeLessThanOrEqual(SCENE_SIZE);
      expect(b.y + b.height).toBeLessThanOrEqual(SCENE_SIZE);
    }
  });

  it("fits every bouquet placement, with its reach, for 1 to 10 items and 60 seeds", () => {
    const b = sceneBounds("bouquet-fan");
    const packaging = makePackaging({ layoutType: "bouquet-fan" });
    for (let count = 1; count <= 10; count += 1) {
      for (let s = 0; s < 60; s += 1) {
        const seed = (s * 2654435761) >>> 0;
        for (const p of computePlacements({ design: makeDesign(count, seed), packaging })) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.3;
          expect(p.x - reach).toBeGreaterThanOrEqual(b.x);
          expect(p.x + reach).toBeLessThanOrEqual(b.x + b.width);
          expect(p.y - reach).toBeGreaterThanOrEqual(b.y);
          expect(p.y + reach).toBeLessThanOrEqual(b.y + b.height);
        }
      }
    }
  });
});

describe("packagingSceneBounds", () => {
  it("crops a bouquet with no layer images and shows the full square once one is uploaded", () => {
    const bouquet = makePackaging({ layoutType: "bouquet-fan" });
    expect(packagingSceneBounds(bouquet)).toEqual(sceneBounds("bouquet-fan"));
    const front = {
      url: "https://cdn.example/f.webp",
      width: 10,
      height: 10,
      anchor: { x: 0.5, y: 1 },
    };
    expect(packagingSceneBounds({ ...bouquet, layers: { front } })).toEqual(FULL_SCENE);
  });
});
