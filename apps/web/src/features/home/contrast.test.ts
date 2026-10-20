import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast";

const css = readFileSync(
  fileURLToPath(new URL("../../styles/tokens.css", import.meta.url)),
  "utf8",
);
const lightBlock = css;

function tokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--gp-([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2]]),
  ) as Record<string, string>;
}

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("rejects a malformed colour", () => {
    expect(() => contrastRatio("red", "#ffffff")).toThrow();
  });
});

// [foreground, background, where it is used on the home page]
const PAIRS: [string, string, string][] = [
  ["on-pink", "pink-strong", "primary buttons"],
  ["ink", "pink-soft", "partner band heading"],
  ["ink-soft", "pink-soft", "partner band body"],
  ["ink-soft", "bg", "muted text on the page"],
  ["ink-soft", "surface", "muted text on cards"],
  ["pink-strong", "surface", "step numbers and pick copy on cards"],
  ["ink", "surface", "card headings"],
  ["ink", "pink-soft", "outlined button on pink band"],
  ["ink-soft", "surface-deep", "disabled primary button label on warm-2"],
  ["ink-soft", "surface-soft", "country suggestion bar text on warm"],
];

describe("token contrast", () => {
  const all = tokens(lightBlock);
  it.each(PAIRS)("%s on %s reaches 4.5:1 (%s)", (fg, bg) => {
    const ratio = contrastRatio(all[fg] ?? "", all[bg] ?? "");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
