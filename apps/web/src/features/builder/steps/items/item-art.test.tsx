import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FIXTURE_ITEMS } from "./_dev/fixtures";
import { ItemArt } from "./item-art";

const base = FIXTURE_ITEMS[0]!.item;

describe("ItemArt", () => {
  it("asks the image optimiser for a card-sized copy, not the full upload", () => {
    const html = renderToStaticMarkup(
      <ItemArt
        item={{
          ...base,
          image: {
            url: "http://localhost:4000/v1/assets/files/abc.webp",
            width: 1600,
            height: 1200,
            anchor: { x: 0.5, y: 1 },
          },
        }}
      />,
    );
    expect(html).toContain(
      "/_next/image?url=http%3A%2F%2Flocalhost%3A4000%2Fv1%2Fassets%2Ffiles%2Fabc.webp",
    );
    expect(html).toContain('sizes="112px"');
    expect(html).toContain('loading="lazy"');
  });

  it("draws the silhouette when there is no image", () => {
    const html = renderToStaticMarkup(<ItemArt item={{ ...base, image: undefined }} />);
    expect(html).toContain("<svg");
    expect(html).not.toContain("<img");
  });
});
