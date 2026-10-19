import { describe, expect, it } from "vitest";

import { makeDesign, makeItems, makePackaging } from "../../test/fixtures";

import {
  itemImageBox,
  LAYER_BOX,
  nextImageStatus,
  shouldMountImage,
  showsPlaceholder,
} from "./images";
import { buildSceneModel } from "./model";
import { itemMotionProps, MOTION_MAX_MS, FADE, SLOT_SPRING } from "./motion-config";
import { observeNearViewport, observeWidth } from "./observers";
import type { SizeObserverCtor, ViewObserverCtor } from "./observers";

describe("itemImageBox", () => {
  it("fits the longest side to the base size and puts the anchor on the origin", () => {
    expect(itemImageBox({ url: "/a", width: 100, height: 200, anchor: { x: 0.5, y: 1 } })).toEqual({
      x: -50,
      y: -200,
      width: 100,
      height: 200,
    });
    expect(itemImageBox({ url: "/a", width: 400, height: 100, anchor: { x: 0, y: 0 } })).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 50,
    });
  });

  it("gives packaging layers the whole scene", () => {
    expect(LAYER_BOX).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
  });
});

describe("image status", () => {
  it("shows the placeholder until the image loads", () => {
    expect(showsPlaceholder("pending")).toBe(true);
    expect(showsPlaceholder("loaded")).toBe(false);
  });

  it("stays on the placeholder after an error, even if a load event follows", () => {
    const failed = nextImageStatus("pending", "error");
    expect(failed).toBe("error");
    expect(showsPlaceholder(failed)).toBe(true);
    expect(nextImageStatus(failed, "load")).toBe("error");
  });

  it("moves from pending to loaded", () => {
    expect(nextImageStatus("pending", "load")).toBe("loaded");
    expect(nextImageStatus("loaded", "load")).toBe("loaded");
  });

  it("fetches only near the viewport and never again after an error", () => {
    expect(shouldMountImage("pending", false)).toBe(false);
    expect(shouldMountImage("pending", true)).toBe(true);
    expect(shouldMountImage("loaded", true)).toBe(true);
    expect(shouldMountImage("error", true)).toBe(false);
  });
});

describe("motion config", () => {
  it("keeps every animation under 400 ms", () => {
    expect(MOTION_MAX_MS).toBe(400);
    expect(SLOT_SPRING.duration * 1000).toBeLessThan(MOTION_MAX_MS);
    expect(FADE.duration * 1000).toBeLessThan(MOTION_MAX_MS);
  });

  it("fades items in only when they enter after first paint, and out when they leave", () => {
    expect(itemMotionProps(false, true)).toMatchObject({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    });
    expect(itemMotionProps(false, false).initial).toBe(false);
  });

  it("has no entry, no exit and zero duration under reduced motion", () => {
    const props = itemMotionProps(true, true);
    expect(props.initial).toBe(false);
    expect(props.transition).toEqual({ duration: 0 });
    expect("exit" in props).toBe(false);
  });
});

describe("buildSceneModel", () => {
  it("keys entries by expanded item index and paints low z first", () => {
    const model = buildSceneModel({
      design: makeDesign(4, 5, 2),
      packaging: makePackaging(),
      items: makeItems(4),
    });
    expect(model.entries).toHaveLength(8);
    expect(new Set(model.entries.map((e) => e.key)).size).toBe(8);
    const zs = model.entries.map((e) => e.placement.z);
    expect(zs).toEqual([...zs].sort((a, b) => a - b));
  });

  it("keeps the same keys across a shuffle so items move instead of remounting", () => {
    const input = { packaging: makePackaging(), items: makeItems(5) };
    const keys = (seed: number) =>
      buildSceneModel({ ...input, design: makeDesign(5, seed) })
        .entries.map((e) => e.key)
        .sort((a, b) => a - b);
    expect(keys(1)).toEqual(keys(2));
  });

  it("falls back to a grey 'other' silhouette for an unknown item", () => {
    const model = buildSceneModel({
      design: makeDesign(1),
      packaging: makePackaging(),
      items: [],
    });
    expect(model.entries[0]?.art.shape).toBe("other");
  });
});

describe("observers", () => {
  const element = { getBoundingClientRect: () => ({ width: 321 }) } as unknown as Element;

  it("reports the current width once when ResizeObserver is missing", () => {
    const widths: number[] = [];
    const stop = observeWidth(element, (w) => widths.push(w), undefined);
    expect(widths).toEqual([321]);
    expect(() => stop()).not.toThrow();
  });

  it("reports width changes and disconnects", () => {
    let callback: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    let disconnected = false;
    class FakeResizeObserver {
      constructor(cb: (entries: { contentRect: { width: number } }[]) => void) {
        callback = cb;
      }
      observe() {}
      disconnect() {
        disconnected = true;
      }
    }
    const widths: number[] = [];
    const stop = observeWidth(
      element,
      (w) => widths.push(w),
      FakeResizeObserver as SizeObserverCtor,
    );
    callback?.([{ contentRect: { width: 100 } }]);
    callback?.([{ contentRect: { width: 250 } }]);
    expect(widths).toEqual([100, 250]);
    stop();
    expect(disconnected).toBe(true);
  });

  it("treats the scene as near the viewport when IntersectionObserver is missing", () => {
    const seen: boolean[] = [];
    observeNearViewport(element, (near) => seen.push(near), "200px", undefined);
    expect(seen).toEqual([true]);
  });

  it("passes the root margin and reports intersection changes", () => {
    let callback: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    let margin: string | undefined;
    class FakeIntersectionObserver {
      constructor(
        cb: (entries: { isIntersecting: boolean }[]) => void,
        options?: { rootMargin?: string },
      ) {
        callback = cb;
        margin = options?.rootMargin;
      }
      observe() {}
      disconnect() {}
    }
    const seen: boolean[] = [];
    observeNearViewport(
      element,
      (near) => seen.push(near),
      "50px",
      FakeIntersectionObserver as ViewObserverCtor,
    );
    callback?.([{ isIntersecting: false }]);
    callback?.([{ isIntersecting: true }]);
    expect(margin).toBe("50px");
    expect(seen).toEqual([false, true]);
  });
});
