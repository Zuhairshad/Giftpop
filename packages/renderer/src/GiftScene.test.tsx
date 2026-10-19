import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { makeDesign, makeItems, makePackaging } from "../test/fixtures";

import { shade } from "./placeholders/color";

import { describeGift, GiftScene } from "./index";

afterEach(cleanup);

describe("GiftScene", () => {
  const items = makeItems(3);
  const design = makeDesign(3);
  const packaging = makePackaging();

  it("renders a placeholder silhouette for each item with no image", () => {
    const { container } = render(<GiftScene design={design} packaging={packaging} items={items} />);
    const placeholders = container.querySelectorAll("[data-placeholder]");
    expect(placeholders).toHaveLength(3);
    expect(Array.from(placeholders).map((el) => el.getAttribute("data-placeholder"))).toEqual([
      "bar",
      "bottle",
      "jar",
    ]);
    expect(container.querySelectorAll("image")).toHaveLength(0);
  });

  it("exposes an accessible label listing the item names", () => {
    const { getByRole } = render(<GiftScene design={design} packaging={packaging} items={items} />);
    const label = getByRole("img").getAttribute("aria-labelledby");
    const text = label ? document.getElementById(label)?.textContent : "";
    expect(text).toBe("Gift in Classic bouquet: 1 x Item 1, 1 x Item 2, 1 x Item 3");
    expect(getByRole("img", { name: /Item 1.*Item 2.*Item 3/ })).toBeTruthy();
  });

  it("shows quantity in the label and survives a missing catalog item", () => {
    const withQty = makeDesign(2, 1, 3);
    expect(describeGift(withQty, packaging, items)).toBe(
      "Gift in Classic bouquet: 3 x Item 1, 3 x Item 2",
    );
    const { container } = render(<GiftScene design={withQty} packaging={packaging} items={[]} />);
    expect(container.querySelectorAll("[data-placeholder='other']")).toHaveLength(6);
    expect(describeGift(withQty, packaging, [])).toContain("Unknown item");
  });

  it("says so when the design has no items", () => {
    expect(describeGift(makeDesign(0), packaging, items)).toBe(
      "Gift in Classic bouquet: no items yet",
    );
  });

  it("draws an item image, anchored, when the item has one", () => {
    const withImage = items.map((item, i) =>
      i === 0
        ? { ...item, image: { url: "/a.webp", width: 100, height: 200, anchor: { x: 0.5, y: 1 } } }
        : item,
    );
    const { container } = render(
      <GiftScene design={design} packaging={packaging} items={withImage} />,
    );
    const image = container.querySelector("image");
    expect(image?.getAttribute("href")).toBe("/a.webp");
    expect(image?.getAttribute("x")).toBe("-50");
    expect(image?.getAttribute("y")).toBe("-200");
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);
  });

  it("uses packaging layer images instead of placeholders when present", () => {
    const layered = makePackaging({
      layers: {
        back: { url: "/back.webp", width: 10, height: 10, anchor: { x: 0, y: 0 } },
        front: { url: "/front.webp", width: 10, height: 10, anchor: { x: 0, y: 0 } },
      },
    });
    const { container } = render(<GiftScene design={design} packaging={layered} items={items} />);
    const urls = Array.from(container.querySelectorAll("image")).map((i) => i.getAttribute("href"));
    expect(urls).toEqual(["/back.webp", "/front.webp"]);
  });

  it("paints back layer, then items, then front layer", () => {
    const { container } = render(<GiftScene design={design} packaging={packaging} items={items} />);
    const layers = Array.from(container.querySelectorAll("[data-layer]")).map((el) =>
      el.getAttribute("data-layer"),
    );
    expect(layers).toEqual(["back", "items", "front"]);
  });

  it("works for the box-grid layout and scales via viewBox", () => {
    const { container } = render(
      <GiftScene
        design={design}
        packaging={makePackaging({ layoutType: "box-grid" })}
        items={items}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 1000 1000");
    expect(svg?.getAttribute("data-layout")).toBe("box-grid");
  });

  it("adds motion styles, with a reduced-motion override, only when motion is on", () => {
    const off = render(<GiftScene design={design} packaging={packaging} items={items} />);
    expect(off.container.querySelector("style")).toBeNull();
    off.unmount();
    const on = render(<GiftScene design={design} packaging={packaging} items={items} motion />);
    expect(on.container.querySelector("style")?.textContent).toContain("prefers-reduced-motion");
    expect(on.container.querySelectorAll(".gp-scene-motion")).toHaveLength(3);
  });

  it("renders to static markup without a client runtime", () => {
    const html = renderToStaticMarkup(
      <GiftScene design={design} packaging={packaging} items={items} />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain("Item 1");
  });

  it("renders the same markup for the same design and seed", () => {
    const a = renderToStaticMarkup(
      <GiftScene design={design} packaging={packaging} items={items} />,
    );
    const b = renderToStaticMarkup(
      <GiftScene design={design} packaging={packaging} items={items} />,
    );
    expect(a.replace(/id="[^"]*"/g, "")).toBe(b.replace(/id="[^"]*"/g, ""));
  });
});

describe("shade", () => {
  it("darkens, lightens and handles short hex", () => {
    expect(shade("#ffffff", -0.5)).toBe("#808080");
    expect(shade("#000", 1)).toBe("#ffffff");
    expect(shade("not-a-colour", 0)).toBe("#808080");
  });
});
