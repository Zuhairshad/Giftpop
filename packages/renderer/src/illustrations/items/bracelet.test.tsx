import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItemIllustrationSvg } from "../ItemIllustration";
import { ITEM_ART_SIZE } from "../types";

import { BraceletIllustration } from "./bracelet";

const render = (color: string) =>
  renderToStaticMarkup(
    <svg>
      <BraceletIllustration color={color} />
    </svg>,
  );

describe("BraceletIllustration", () => {
  it("draws five clover charms of four lobes each, and a lobster clasp", () => {
    const markup = render("#e08a9b");
    expect(markup.match(/data-charm="clover"/g)).toHaveLength(5);
    expect(markup).toContain('data-clasp="lobster"');
    expect(markup.match(/rotate\(270\)/g)).toHaveLength(5);
  });

  it("has no NaN or undefined in its output", () => {
    expect(render("#e08a9b")).not.toMatch(/NaN|undefined/);
    expect(render("#101010")).not.toMatch(/NaN|undefined/);
  });

  it("renders inside the shared item box", () => {
    const markup = renderToStaticMarkup(<ItemIllustrationSvg shape="bracelet" color="#e08a9b" />);
    expect(markup).toContain(`viewBox="0 0 ${ITEM_ART_SIZE} ${ITEM_ART_SIZE}"`);
    expect(markup).toContain('data-placeholder="bracelet"');
  });

  it("keeps ids unique across two copies", () => {
    const two = renderToStaticMarkup(
      <svg>
        <BraceletIllustration color="#e08a9b" />
        <BraceletIllustration color="#e08a9b" />
      </svg>,
    );
    const ids = [...two.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
