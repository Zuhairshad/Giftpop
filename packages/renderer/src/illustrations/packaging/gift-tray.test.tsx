import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GIFT_TRAY } from "../../layouts/gift-tray";
import { SCENE_SIZE } from "../../layouts/types";

import { GiftTrayIllustration } from "./gift-tray";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = GiftTrayIllustration;

function ids(markup: string): string[] {
  return Array.from(markup.matchAll(/\sid="([^"]+)"/g), (m) => m[1] ?? "");
}

describe("gift tray art", () => {
  it("renders paths without NaN or undefined, for dark and light colours too", () => {
    for (const c of [WRAP, "#101010", "#ffffff"]) {
      for (const C of [Back, Front]) {
        const out = renderToStaticMarkup(<C wrapper={c} ribbon={c} />);
        expect(out).not.toMatch(/NaN|undefined/);
        expect(out).toContain("<path");
      }
    }
  });

  it("follows the wrapper and ribbon colours", () => {
    const a = renderToStaticMarkup(<Front wrapper={WRAP} ribbon={RIBBON} />);
    const b = renderToStaticMarkup(<Front wrapper="#334455" ribbon="#aa2200" />);
    expect(a).toContain(WRAP);
    expect(a).toContain(RIBBON);
    expect(b).not.toContain(WRAP);
    expect(b).not.toContain(RIBBON);
    expect(renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />)).not.toEqual(
      renderToStaticMarkup(<Back wrapper="#334455" ribbon="#aa2200" />),
    );
  });

  it("keeps ids unique across copies and stays decorative", () => {
    const out = renderToStaticMarkup(
      <svg>
        <Back wrapper={WRAP} ribbon={RIBBON} />
        <Front wrapper={WRAP} ribbon={RIBBON} />
        <Back wrapper={WRAP} ribbon={RIBBON} />
        <Front wrapper={WRAP} ribbon={RIBBON} />
      </svg>,
    );
    const all = ids(out);
    expect(new Set(all).size).toBe(all.length);
    expect(out).not.toMatch(/<title|role=/);
  });

  it("is wide and flat and fits inside the scene", () => {
    const width = GIFT_TRAY.right - GIFT_TRAY.left;
    const height = GIFT_TRAY.bottomY - GIFT_TRAY.backY;
    expect(width).toBeGreaterThan(height * 2);
    expect(GIFT_TRAY.left).toBeGreaterThanOrEqual(60);
    expect(GIFT_TRAY.right).toBeLessThanOrEqual(SCENE_SIZE - 60);
    expect(GIFT_TRAY.bottomY).toBeLessThan(SCENE_SIZE - 100);
  });
});
