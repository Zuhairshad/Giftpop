import { ITEM_SHAPES } from "@giftpop/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LAYOUT_TYPES } from "../layouts";
import { mix, shade } from "../placeholders/color";

import { ruffleEdge } from "./packaging/ruffle";
import { boxTones, wrapTones } from "./packaging/tones";
import { itemPalette, luma } from "./palette";

import {
  ITEM_ART_SIZE,
  ITEM_ILLUSTRATIONS,
  ItemIllustrationSvg,
  PACKAGING_ILLUSTRATIONS,
} from "./index";

const PINK = "#e08a9b";
const TEAL = "#2a9d8f";

function ids(markup: string): string[] {
  return Array.from(markup.matchAll(/\sid="([^"]+)"/g), (m) => m[1] ?? "");
}

describe("illustration registry", () => {
  it("has an item illustration for every item shape", () => {
    for (const shape of ITEM_SHAPES) expect(ITEM_ILLUSTRATIONS[shape]).toBeTypeOf("function");
    expect(Object.keys(ITEM_ILLUSTRATIONS).sort()).toEqual([...ITEM_SHAPES].sort());
  });

  it("has packaging art (Back and Front) for every layout type", () => {
    for (const layout of LAYOUT_TYPES) {
      const art = PACKAGING_ILLUSTRATIONS[layout];
      expect(art, layout).toBeDefined();
      expect(art?.Back).toBeTypeOf("function");
      expect(art?.Front).toBeTypeOf("function");
    }
  });
});

describe("item illustrations", () => {
  for (const shape of ITEM_SHAPES) {
    describe(shape, () => {
      const Art = ITEM_ILLUSTRATIONS[shape];
      const render = (color: string) =>
        renderToStaticMarkup(
          <svg>
            <Art color={color} />
          </svg>,
        );

      it("renders a group named after the shape", () => {
        const markup = render(PINK);
        expect(markup).toContain(`<g data-placeholder="${shape}"`);
        expect(markup).toContain("<path");
      });

      it("follows the tint: fill and the derived outline both change with the colour", () => {
        const pink = render(PINK);
        const teal = render(TEAL);
        expect(pink).not.toEqual(teal);
        expect(pink).toContain(PINK);
        expect(pink).toContain(shade(PINK, -0.38));
        expect(teal).toContain(TEAL);
        expect(teal).toContain(shade(TEAL, -0.38));
        expect(teal).not.toContain(PINK);
        expect(teal).not.toContain(shade(PINK, -0.38));
      });

      it("renders for near-black and near-white colours", () => {
        for (const color of ["#000000", "#ffffff", "#fff", "#111"]) {
          expect(render(color)).toContain(`data-placeholder="${shape}"`);
        }
      });

      it("keeps a visible outline on near-black and near-white", () => {
        for (const color of ["#000000", "#111111", "#ffffff", "#fafafa"]) {
          const outline = itemPalette(color).dark;
          const markup = render(color);
          expect(markup, color).toContain(`stroke="${outline}"`);
          expect(Math.abs(luma(outline) - luma(color)), color).toBeGreaterThan(0.25);
          expect(markup, color).not.toContain("NaN");
        }
      });
    });
  }

  it("gives every shape its own drawing", () => {
    // Strip what the frame adds (the shape name, the fit) and the generated ids, then compare.
    const drawings = ITEM_SHAPES.map((shape) => {
      const Art = ITEM_ILLUSTRATIONS[shape];
      return renderToStaticMarkup(
        <svg>
          <Art color={PINK} />
        </svg>,
      )
        .replace(/<g data-placeholder="[^"]*" transform="[^"]*">/, "<g>")
        .replace(/(id="|url\(#)[^")]+/g, "$1x");
    });
    expect(new Set(drawings).size).toBe(ITEM_SHAPES.length);
  });

  it("draws every shape at its own fit, centred in the 200 box", () => {
    for (const shape of ITEM_SHAPES) {
      const Art = ITEM_ILLUSTRATIONS[shape];
      const markup = renderToStaticMarkup(
        <svg>
          <Art color={PINK} />
        </svg>,
      );
      const fit =
        /data-placeholder="[^"]*" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/.exec(
          markup,
        );
      expect(fit, shape).not.toBeNull();
      const [, x, y, scale] = (fit ?? []).map(Number);
      // Within a quarter of the box of the anchor, and not left at the untuned default.
      expect(Math.abs((x ?? 0) - 100), shape).toBeLessThan(25);
      expect(Math.abs((y ?? 0) - 100), shape).toBeLessThan(30);
      expect(scale, shape).toBeGreaterThan(0.9);
      expect(scale, shape).toBeLessThan(1.6);
    }
  });

  it("keeps ids unique when many copies share one tree", () => {
    const markup = renderToStaticMarkup(
      <svg>
        {ITEM_SHAPES.map((shape) => {
          const Art = ITEM_ILLUSTRATIONS[shape];
          return (
            <g key={shape}>
              <Art color={PINK} />
              <Art color={PINK} />
            </g>
          );
        })}
      </svg>,
    );
    const all = ids(markup);
    expect(all.length).toBeGreaterThan(ITEM_SHAPES.length);
    expect(new Set(all).size).toBe(all.length);
  });

  it("is a pure, deterministic render", () => {
    const once = renderToStaticMarkup(<ItemIllustrationSvg shape="bar" color={PINK} />);
    expect(renderToStaticMarkup(<ItemIllustrationSvg shape="bar" color={PINK} />)).toEqual(once);
  });

  it("draws the standalone svg in the 200 box", () => {
    const markup = renderToStaticMarkup(<ItemIllustrationSvg shape="mug" color={PINK} size={64} />);
    expect(markup).toContain(`viewBox="0 0 ${ITEM_ART_SIZE} ${ITEM_ART_SIZE}"`);
    expect(markup).toContain('aria-hidden="true"');
  });

  it("derives near-black outlines upward instead of darkening into the fill", () => {
    expect(itemPalette("#101010").dark).not.toEqual("#101010");
    expect(luma(itemPalette("#101010").dark)).toBeGreaterThan(luma("#101010"));
    expect(itemPalette("#e08a9b").dark).toEqual(shade("#e08a9b", -0.38));
  });
});

describe("packaging illustrations", () => {
  const wrappers = { dark: "#111111", light: "#fafafa", kraft: "#c8a97e" };

  for (const layout of LAYOUT_TYPES) {
    describe(layout, () => {
      const art = PACKAGING_ILLUSTRATIONS[layout];

      for (const [name, wrapper] of Object.entries(wrappers)) {
        it(`renders Back and Front for a ${name} wrapper`, () => {
          if (!art) throw new Error("missing art");
          const markup = renderToStaticMarkup(
            <svg>
              <art.Back wrapper={wrapper} ribbon="#e8467c" />
              <art.Front wrapper={wrapper} ribbon="#e8467c" />
            </svg>,
          );
          expect(markup).toContain('data-art="back"');
          expect(markup).toContain('data-art="front"');
          expect(markup).not.toContain("NaN");
          expect(markup).not.toContain("undefined");
        });
      }

      it("recolours from the wrapper and the ribbon", () => {
        if (!art) throw new Error("missing art");
        const render = (wrapper: string, ribbon: string) =>
          renderToStaticMarkup(
            <svg>
              <art.Back wrapper={wrapper} ribbon={ribbon} />
              <art.Front wrapper={wrapper} ribbon={ribbon} />
            </svg>,
          );
        const a = render("#c8a97e", "#c0392b");
        const b = render("#8e6bd1", "#2e7d5b");
        expect(a).toContain("#c8a97e");
        expect(a).toContain("#c0392b");
        expect(b).not.toContain("#c8a97e");
        expect(b).not.toContain("#c0392b");
        expect(b).toContain("#2e7d5b");
      });

      it("keeps ids unique when two packagings share a tree", () => {
        if (!art) throw new Error("missing art");
        const markup = renderToStaticMarkup(
          <svg>
            <art.Front wrapper="#c8a97e" ribbon="#c0392b" />
            <art.Front wrapper="#c8a97e" ribbon="#c0392b" />
          </svg>,
        );
        const all = ids(markup);
        expect(all.length).toBe(2);
        expect(new Set(all).size).toBe(2);
      });
    });
  }
});

describe("wrapTones", () => {
  it("separates panels on near-black and near-white wrappers", () => {
    for (const color of ["#000000", "#111111", "#ffffff", "#fafafa", "#c8a97e"]) {
      const t = wrapTones(color);
      expect(new Set([t.base, t.lit, t.mid]).size, color).toBeGreaterThan(1);
      expect(t.back).not.toEqual(t.edge);
    }
    expect(wrapTones("#111111").lit).not.toEqual("#111111");
    expect(wrapTones("#ffffff").lit).toEqual("#f5f5f5");
  });
});

describe("mix", () => {
  it("blends between two colours and clamps the amount", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#102030", "#ffffff", 2)).toBe("#ffffff");
    expect(mix("#fff", "#000", -1)).toBe("#ffffff");
  });
});

describe("boxTones", () => {
  // The seeded gift box colours, plus near-black and near-white.
  const wrappers = ["#f9c6d3", "#f3ead8", "#3b3b3f", "#c8a27a", "#111111", "#ffffff"];

  it("lines the floor with tissue paler than the wrapper and the warm tile well", () => {
    for (const color of wrappers) {
      const t = boxTones(color);
      expect(luma(t.tissue), color).toBeGreaterThan(0.85);
      // Paper is a warm off-white, so only a pure white wrapper is brighter than its tissue.
      if (color !== "#ffffff") expect(luma(t.tissue), color).toBeGreaterThanOrEqual(luma(color));
    }
  });

  it("keeps walls, creases and outline distinct from the tissue", () => {
    for (const color of wrappers) {
      const t = boxTones(color);
      expect(new Set([t.tissue, t.crease, t.wall, t.side, t.edge]).size, color).toBe(5);
      expect(luma(t.edge), color).toBeLessThan(luma(t.tissue) - 0.3);
    }
  });

  it("darkens walls towards the ink colour, not black, so pinks stay warm", () => {
    const wall = boxTones("#f9c6d3").wall;
    const blackened = shade("#f9c6d3", -0.16);
    // Ink is aubergine, so the wall keeps more blue than plain darkening would.
    expect(parseInt(wall.slice(5, 7), 16)).toBeGreaterThan(parseInt(blackened.slice(5, 7), 16));
  });
});

describe("ruffleEdge", () => {
  it("passes through evenly spaced points and is deterministic", () => {
    const edge = ruffleEdge(100, 300, () => 50, 4, 10);
    expect(edge.points.map(([x]) => x)).toEqual([100, 150, 200, 250, 300]);
    expect(edge.d.match(/Q/g)).toHaveLength(4);
    expect(ruffleEdge(100, 300, () => 50, 4, 10)).toEqual(edge);
  });
});
