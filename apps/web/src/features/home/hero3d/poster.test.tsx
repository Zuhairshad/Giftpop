import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GIFT_TAG, POSTER_ALT, POSTER_VIEWBOX } from "./constants";
import { Poster } from "./poster";
import { SPARKLES, SPRITES } from "./sprites";

describe("Poster", () => {
  const html = renderToStaticMarkup(<Poster />);

  it("is an image with a text alternative that scales to its box", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain(`aria-label="${POSTER_ALT}"`);
    expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(html).toContain(
      `viewBox="${POSTER_VIEWBOX.x} ${POSTER_VIEWBOX.y} ${POSTER_VIEWBOX.w} ${POSTER_VIEWBOX.h}"`,
    );
  });

  it("draws every burst sprite at the layout the timeline rests on", () => {
    for (const def of SPRITES) {
      expect(html).toContain(`translate(${def.x} ${def.y}) rotate(${def.rotDeg})`);
    }
  });

  it("draws the tag text and every sparkle", () => {
    expect(html).toContain(GIFT_TAG.text);
    expect(html).toContain("Happy");
    for (const s of SPARKLES) {
      expect(html).toContain(
        s.kind === "star" ? `translate(${s.x} ${s.y}) scale(` : `cx="${s.x}" cy="${s.y}"`,
      );
    }
  });

  it("keeps the backdrop and hides only the foreground when the canvas takes over", () => {
    const handoff = renderToStaticMarkup(<Poster foreground={false} />);
    expect(html).toContain("opacity:1");
    expect(handoff).toContain("opacity:0");
    expect(handoff).toContain('fill="#FFC2D8" opacity="0.8"');
  });

  it("gives each instance its own pattern ids", () => {
    const two = renderToStaticMarkup(
      <>
        <Poster />
        <Poster />
      </>,
    );
    const ids = [...two.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
