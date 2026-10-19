import type { Item } from "@giftpop/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIXTURE_ITEMS } from "./_dev/fixtures";

const base = FIXTURE_ITEMS[0]!.item;
const withImage = (url: string): Item => ({
  ...base,
  image: { url, width: 1600, height: 1200, anchor: { x: 0.5, y: 1 } },
});

/** Loads the component with the asset hosts `next.config.ts` would inline. */
async function render(item: Item, hosts: string): Promise<string> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_ASSET_BASE_URLS", hosts);
  const { ItemArt } = await import("./item-art");
  return renderToStaticMarkup(<ItemArt item={item} />);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ItemArt", () => {
  it("asks the image optimiser for a card-sized copy, not the full upload", async () => {
    const html = await render(
      withImage("http://localhost:4000/v1/assets/files/abc.webp"),
      "http://localhost:4000/v1/assets/files",
    );
    expect(html).toContain(
      "/_next/image?url=http%3A%2F%2Flocalhost%3A4000%2Fv1%2Fassets%2Ffiles%2Fabc.webp",
    );
    expect(html).toContain('sizes="112px"');
    expect(html).toContain('loading="lazy"');
  });

  it("loads an image from a host the optimiser does not allow as it is, instead of breaking", async () => {
    const html = await render(
      withImage("https://old.example.com/abc.webp"),
      "https://assets.example.com",
    );
    expect(html).toContain('src="https://old.example.com/abc.webp"');
    expect(html).not.toContain("/_next/image");
  });

  it("draws the silhouette when there is no image", async () => {
    const html = await render({ ...base, image: undefined }, "");
    expect(html).toContain("<svg");
    expect(html).not.toContain("<img");
  });
});
