import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NecklaceIllustration } from "./necklace";

describe("NecklaceIllustration", () => {
  it("draws a dashed chain, ring links and a shaded pendant bar", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <NecklaceIllustration color="#e08a9b" />
      </svg>,
    );
    expect(markup).toContain("stroke-dasharray");
    expect(markup).toContain("<circle");
    expect(markup).toContain("clip-path");
  });

  it("keeps ids unique across two copies", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <NecklaceIllustration color="#e08a9b" />
        <NecklaceIllustration color="#e08a9b" />
      </svg>,
    );
    const ids = Array.from(markup.matchAll(/\sid="([^"]+)"/g), (m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
