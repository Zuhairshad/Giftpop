import { describe, expect, it } from "vitest";

import { makeItems, makePackaging } from "../../test/fixtures";

import { ITEM_IMAGE_WIDTH, LAYER_IMAGE_WIDTH, withImageUrls } from "./image-urls";

const asset = (url: string) => ({ url, width: 900, height: 900, anchor: { x: 0.5, y: 1 } });

describe("withImageUrls", () => {
  it("rewrites every item and layer image with the width it is drawn at", () => {
    const [plain, pictured] = makeItems(2);
    const items = [plain!, { ...pictured!, image: asset("https://a/item.webp") }];
    const packaging = makePackaging({ layers: { back: asset("https://a/back.webp") } });
    const seen: [string, number][] = [];
    const out = withImageUrls({ packaging, items }, (url, width) => {
      seen.push([url, width]);
      return `/resized?u=${url}&w=${width}`;
    });
    expect(out.items[0]).toBe(plain);
    expect(out.items[1]?.image?.url).toBe(`/resized?u=https://a/item.webp&w=${ITEM_IMAGE_WIDTH}`);
    expect(out.packaging.layers.back?.url).toBe(
      `/resized?u=https://a/back.webp&w=${LAYER_IMAGE_WIDTH}`,
    );
    expect(out.packaging.layers.front).toBeUndefined();
    expect(seen).toHaveLength(2);
    // Inputs are not mutated.
    expect(items[1]?.image?.url).toBe("https://a/item.webp");
  });

  it("returns the input untouched without a rewriter", () => {
    const input = { packaging: makePackaging(), items: makeItems(1) };
    expect(withImageUrls(input, undefined)).toBe(input);
  });
});
