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

  it("keeps the backdrop and the floor shadow and hides only the foreground", () => {
    const empty = renderToStaticMarkup(<Poster foreground="hide" />);
    const foreground = empty.slice(empty.indexOf("data-hero-poster-foreground"));
    const stage = empty.slice(0, empty.indexOf("data-hero-poster-foreground"));
    expect(html).toContain('class="opacity-100"');
    expect(foreground).toMatch(/^data-hero-poster-foreground="" class="opacity-0"/);
    expect(stage).toContain('fill="#FFC2D8" opacity="0.8"');
    expect(stage).toContain("data-hero-floor");
    expect(foreground).not.toContain("data-hero-floor");
  });

  it("shows the still on first paint only for reduced motion", () => {
    const first = renderToStaticMarkup(<Poster foreground="auto" />);
    expect(first).toContain('class="opacity-0 motion-reduce:opacity-100"');
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
