import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GiftIllustration } from "./gift-illustration";

describe("GiftIllustration", () => {
  const html = renderToStaticMarkup(<GiftIllustration className="size-full" />);

  it("is decorative", () => {
    expect(html).toMatch(/^<svg[^>]*aria-hidden="true"/);
  });

  it("draws item illustrations floating around the box", () => {
    const shapes = [...html.matchAll(/data-placeholder="([a-z-]+)"/g)].map((match) => match[1]);
    expect(shapes).toEqual(["flower", "balloon", "bar", "soft-toy"]);
  });

  it("only floats when the visitor allows motion", () => {
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
    const guarded = /@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*)\}/.exec(css);
    expect(guarded?.[1]).toContain("animation:");
    // No animation outside the guard.
    expect(css.replace(guarded?.[0] ?? "", "")).not.toContain("animation:");
  });

  it("gives each copy its own dot pattern id", () => {
    const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(1);
    expect(html).toContain(`url(#${ids[0]})`);
  });
});
