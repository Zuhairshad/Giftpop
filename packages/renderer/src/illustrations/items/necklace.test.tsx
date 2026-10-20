import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItemIllustrationSvg } from "../ItemIllustration";
import { ITEM_ART_SIZE } from "../types";

import { NecklaceIllustration } from "./necklace";

const render = (color: string) =>
  renderToStaticMarkup(
    <svg>
      <NecklaceIllustration color={color} />
    </svg>,
  );

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

  it("has no NaN or undefined in its output", () => {
    expect(render("#e08a9b")).not.toMatch(/NaN|undefined/);
    expect(render("#101010")).not.toMatch(/NaN|undefined/);
  });

  it("renders inside the shared item box", () => {
    const markup = renderToStaticMarkup(<ItemIllustrationSvg shape="necklace" color="#e08a9b" />);
    expect(markup).toContain(`viewBox="0 0 ${ITEM_ART_SIZE} ${ITEM_ART_SIZE}"`);
    expect(markup).toContain('data-placeholder="necklace"');
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
