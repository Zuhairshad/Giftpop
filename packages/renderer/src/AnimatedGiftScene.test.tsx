import type { Item } from "@giftpop/contracts";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeDesign, makeItems, makePackaging } from "../test/fixtures";

import { AnimatedGiftScene } from "./AnimatedGiftScene";
import { GiftScene } from "./GiftScene";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const packaging = makePackaging();
const items = makeItems(4);

/** The markup skeleton: tags, layer names, item indexes and placeholder shapes, with no styles or ids. */
function structure(root: Element): string[] {
  return Array.from(root.querySelectorAll("*")).map((el) =>
    [
      el.tagName.toLowerCase(),
      el.getAttribute("data-layer"),
      el.getAttribute("data-item-index"),
      el.getAttribute("data-placeholder"),
      el.getAttribute("data-layout"),
      el.tagName.toLowerCase() === "title" ? el.textContent : null,
    ]
      .filter((part) => part !== null)
      .join(":"),
  );
}

function withImage(list: readonly Item[], index: number): Item[] {
  return list.map((item, i) =>
    i === index
      ? { ...item, image: { url: "/a.webp", width: 100, height: 200, anchor: { x: 0.5, y: 1 } } }
      : item,
  );
}

describe("AnimatedGiftScene", () => {
  it("renders the same structure and labels as the static scene", () => {
    const design = makeDesign(4, 3, 2);
    const still = render(<GiftScene design={design} packaging={packaging} items={items} />);
    const expected = structure(still.container);
    still.unmount();
    const moving = render(
      <AnimatedGiftScene design={design} packaging={packaging} items={items} />,
    );
    expect(structure(moving.container)).toEqual(expected);
    expect(moving.getByRole("img").getAttribute("viewBox")).toBe("0 0 1000 1000");
  });

  it("matches the static scene's item transforms once settled", async () => {
    const design = makeDesign(4, 3);
    const still = render(<GiftScene design={design} packaging={packaging} items={items} />);
    const expected = Array.from(
      still.container.querySelectorAll<SVGGElement>("[data-item-index]"),
    ).map((g) => g.style.transform);
    still.unmount();
    const { container } = render(
      <AnimatedGiftScene design={design} packaging={packaging} items={items} />,
    );
    const actual = () =>
      Array.from(container.querySelectorAll<SVGGElement>("[data-item-index]")).map(
        (g) => g.style.transform,
      );
    await waitFor(() => expect(actual()).toEqual(expected));
  });

  it("pivots every item on the scene origin, like the static scene's translate-rotate-scale", () => {
    const { container } = render(
      <AnimatedGiftScene design={makeDesign(3)} packaging={packaging} items={items} />,
    );
    for (const g of container.querySelectorAll<SVGGElement>("[data-item-index]")) {
      expect(g.style.transformOrigin).toMatch(/^0(px|%)? 0(px|%)?/);
      expect(g.style.transformBox).toBe("view-box");
    }
    const html = renderToStaticMarkup(
      <AnimatedGiftScene design={makeDesign(3)} packaging={packaging} items={items} />,
    );
    expect(html).not.toContain("transform-origin:50%");
  });

  it("keeps the same DOM nodes across a shuffle instead of remounting items", () => {
    const view = render(
      <AnimatedGiftScene design={makeDesign(4, 1)} packaging={packaging} items={items} />,
    );
    const nodes = () =>
      new Map(
        Array.from(view.container.querySelectorAll("[data-item-index]")).map((g) => [
          g.getAttribute("data-item-index"),
          g,
        ]),
      );
    const before = nodes();
    view.rerender(
      <AnimatedGiftScene design={makeDesign(4, 2)} packaging={packaging} items={items} />,
    );
    const after = nodes();
    expect([...after.keys()]).toEqual([...before.keys()]);
    for (const [index, node] of before) expect(after.get(index)).toBe(node);
  });

  it("fades new items in, and fades leaving items out before removing them", async () => {
    const view = render(
      <AnimatedGiftScene design={makeDesign(2)} packaging={packaging} items={items} />,
    );
    // Items present at first paint are fully visible: nothing hidden in server markup.
    for (const g of view.container.querySelectorAll<SVGGElement>("[data-item-index]")) {
      expect(g.style.opacity).not.toBe("0");
    }
    view.rerender(<AnimatedGiftScene design={makeDesign(3)} packaging={packaging} items={items} />);
    const entering = view.container.querySelector<SVGGElement>("[data-item-index='2']");
    expect(entering).not.toBeNull();
    expect(entering?.style.opacity).toBe("0");
    await waitFor(() => expect(entering?.style.opacity).toBe("1"));

    view.rerender(<AnimatedGiftScene design={makeDesign(2)} packaging={packaging} items={items} />);
    await waitFor(() => expect(view.container.querySelector("[data-item-index='2']")).toBeNull());
    expect(view.container.querySelectorAll("[data-item-index]")).toHaveLength(2);
  });

  it("server-renders items visible and without fetching images", () => {
    const html = renderToStaticMarkup(
      <AnimatedGiftScene
        design={makeDesign(3)}
        packaging={packaging}
        items={withImage(items, 0)}
      />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain("data-placeholder");
    expect(html).not.toContain("<image");
    expect(html).not.toContain("opacity:0");
  });
});

describe("AnimatedGiftScene images", () => {
  const design = makeDesign(2);

  it("shows the placeholder until the image loads, then swaps without moving anything", () => {
    const { container } = render(
      <AnimatedGiftScene design={design} packaging={packaging} items={withImage(items, 0)} />,
    );
    const image = container.querySelector("image");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("decoding")).toBe("async");
    // The box is fixed from the asset's size and anchor before any bytes arrive.
    expect(image?.getAttribute("x")).toBe("-50");
    expect(image?.getAttribute("y")).toBe("-200");
    expect(image?.getAttribute("width")).toBe("100");
    expect(image?.getAttribute("height")).toBe("200");
    expect(image?.style.opacity).toBe("0");
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);

    fireEvent.load(image as Element);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(1);
    expect(container.querySelector("image")?.style.opacity).not.toBe("0");
    expect(container.querySelector("image")?.getAttribute("x")).toBe("-50");
  });

  it("stays on the placeholder when the image fails", () => {
    const { container } = render(
      <AnimatedGiftScene design={design} packaging={packaging} items={withImage(items, 0)} />,
    );
    fireEvent.error(container.querySelector("image") as Element);
    expect(container.querySelector("image")).toBeNull();
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);
  });

  it("covers a failed packaging layer with its placeholder", () => {
    const layered = makePackaging({
      layoutType: "box-grid",
      layers: { back: { url: "/back.webp", width: 10, height: 10, anchor: { x: 0, y: 0 } } },
    });
    const { container } = render(
      <AnimatedGiftScene design={design} packaging={layered} items={items} />,
    );
    const back = () => container.querySelector("[data-layer='back']");
    expect(back()?.querySelector("image")?.getAttribute("width")).toBe("1000");
    // The placeholder is drawn under the pending image, and stays after a failure.
    expect(back()?.querySelector("[data-art='back']")).not.toBeNull();
    fireEvent.error(back()?.querySelector("image") as Element);
    expect(back()?.querySelector("image")).toBeNull();
    expect(back()?.querySelector("[data-art='back']")).not.toBeNull();
  });

  it("waits until the scene is near the viewport before fetching", () => {
    let notify: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    class FakeIntersectionObserver {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        notify = cb;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    const { container } = render(
      <AnimatedGiftScene design={design} packaging={packaging} items={withImage(items, 0)} />,
    );
    expect(container.querySelector("image")).toBeNull();
    act(() => notify?.([{ isIntersecting: true }]));
    expect(container.querySelector("image")).not.toBeNull();
  });
});

describe("AnimatedGiftScene size", () => {
  it("reports the rendered width through ResizeObserver", () => {
    let notify: ((entries: { contentRect: { width: number } }[]) => void) | undefined;
    class FakeResizeObserver {
      constructor(cb: (entries: { contentRect: { width: number } }[]) => void) {
        notify = cb;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const widths: number[] = [];
    render(
      <AnimatedGiftScene
        design={makeDesign(1)}
        packaging={packaging}
        items={items}
        onSizeChange={(w) => widths.push(w)}
      />,
    );
    act(() => notify?.([{ contentRect: { width: 390 } }]));
    act(() => notify?.([{ contentRect: { width: 1280 } }]));
    expect(widths).toEqual([390, 1280]);
  });

  it("still renders and reports a width when ResizeObserver is missing", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const widths: number[] = [];
    const { container } = render(
      <AnimatedGiftScene
        design={makeDesign(1)}
        packaging={packaging}
        items={items}
        onSizeChange={(w) => widths.push(w)}
      />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(widths).toHaveLength(1);
    expect(Number.isFinite(widths[0])).toBe(true);
  });
});
