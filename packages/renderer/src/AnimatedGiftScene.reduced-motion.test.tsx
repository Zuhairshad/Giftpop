import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { makeDesign, makeItems, makePackaging } from "../test/fixtures";

import { AnimatedGiftScene } from "./AnimatedGiftScene";

// The reduced-motion preference is read once per module load, so this file
// sets it before anything renders and owns it for every test here.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
});

afterEach(cleanup);

const packaging = makePackaging();
const items = makeItems(4);

function transforms(root: Element): Record<string, string> {
  return Object.fromEntries(
    Array.from(root.querySelectorAll<SVGGElement>("[data-item-index]")).map((g) => [
      g.getAttribute("data-item-index") ?? "",
      g.style.transform,
    ]),
  );
}

describe("AnimatedGiftScene with prefers-reduced-motion", () => {
  it("shows an entering item at full opacity and full size at once", () => {
    const view = render(
      <AnimatedGiftScene design={makeDesign(2)} packaging={packaging} items={items} />,
    );
    view.rerender(<AnimatedGiftScene design={makeDesign(3)} packaging={packaging} items={items} />);
    const entering = view.container.querySelector<SVGGElement>("[data-item-index='2']");
    expect(entering).not.toBeNull();
    expect(entering?.style.opacity).not.toBe("0");
    // Scale 1 of the placement, not the 0.6 grow-in start.
    const scale = Number(/scale\(([\d.]+)\)/.exec(entering?.style.transform ?? "")?.[1]);
    expect(scale).toBeGreaterThan(0.6);
  });

  it("removes a leaving item at once, with no fade", () => {
    const view = render(
      <AnimatedGiftScene design={makeDesign(3)} packaging={packaging} items={items} />,
    );
    view.rerender(<AnimatedGiftScene design={makeDesign(2)} packaging={packaging} items={items} />);
    expect(view.container.querySelector("[data-item-index='2']")).toBeNull();
  });

  it("jumps to the new arrangement on a shuffle instead of animating", async () => {
    const view = render(
      <AnimatedGiftScene design={makeDesign(4, 1)} packaging={packaging} items={items} />,
    );
    const before = transforms(view.container);
    view.rerender(
      <AnimatedGiftScene design={makeDesign(4, 2)} packaging={packaging} items={items} />,
    );
    // One frame is enough for motion to flush a jump; an animation would take ~300 ms.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const after = transforms(view.container);
    expect(after).not.toEqual(before);

    const fresh = render(
      <AnimatedGiftScene design={makeDesign(4, 2)} packaging={packaging} items={items} />,
    );
    expect(after).toEqual(transforms(fresh.container));
  });
});
