import type { Asset } from "@giftpop/contracts";
import { describe, expect, it, vi } from "vitest";

import { toColorInputValue } from "./colour";
import {
  commitImageDraft,
  draftFromAsset,
  draftFromUpload,
  markCommitted,
  moveAnchor,
} from "./image-draft";

const asset: Asset = {
  url: "https://cdn.test/a.webp",
  width: 300,
  height: 600,
  anchor: { x: 0.5, y: 1 },
};

describe("image drafts", () => {
  it("drops the id and date from an upload when making the inline asset", () => {
    const draft = draftFromUpload({ ...asset, id: "d".repeat(24), createdAt: "x" } as Asset & {
      id: string;
    });
    expect(draft.asset).toEqual(asset);
    expect(draft.assetId).toBe("d".repeat(24));
    expect(draft.anchorChanged).toBe(false);
  });

  it("marks a moved anchor, and ignores a move to the same place", () => {
    const draft = draftFromAsset(asset);
    expect(draft && moveAnchor(draft, { x: 0.5, y: 1 })).toBe(draft);
    const moved = draft && moveAnchor(draft, { x: 0.2, y: 0.9 });
    expect(moved).toMatchObject({ anchorChanged: true, asset: { anchor: { x: 0.2, y: 0.9 } } });
  });

  it("commits nothing when there is no image", async () => {
    const patch = vi.fn();
    await expect(commitImageDraft(undefined, patch)).resolves.toBeUndefined();
    expect(patch).not.toHaveBeenCalled();
  });

  it("PATCHes a moved anchor on an uploaded asset and uses the returned asset", async () => {
    const draft = moveAnchor(draftFromUpload({ ...asset, id: "d".repeat(24) }), { x: 0.1, y: 0.2 });
    const patch = vi.fn(() =>
      Promise.resolve({ ...asset, anchor: { x: 0.1, y: 0.2 }, id: "d".repeat(24) } as Asset),
    );
    const committed = await commitImageDraft(draft, patch);
    expect(patch).toHaveBeenCalledWith("d".repeat(24), { x: 0.1, y: 0.2 });
    expect(committed).toEqual({ ...asset, anchor: { x: 0.1, y: 0.2 } });
  });

  it("skips the PATCH when the anchor did not move or the asset has no id", async () => {
    const patch = vi.fn();
    const uploaded = draftFromUpload({ ...asset, id: "d".repeat(24) });
    await expect(commitImageDraft(uploaded, patch)).resolves.toEqual(asset);

    const inline = draftFromAsset(asset);
    const moved = inline && moveAnchor(inline, { x: 0, y: 0 });
    await expect(commitImageDraft(moved, patch)).resolves.toEqual({
      ...asset,
      anchor: { x: 0, y: 0 },
    });
    expect(patch).not.toHaveBeenCalled();
  });

  it("clears the changed flag after a save", () => {
    const draft = moveAnchor(draftFromUpload({ ...asset, id: "d".repeat(24) }), { x: 0, y: 0 });
    expect(markCommitted(draft)?.anchorChanged).toBe(false);
    expect(markCommitted(undefined)).toBeUndefined();
  });
});

describe("toColorInputValue", () => {
  it("expands short hex and lowercases", () => {
    expect(toColorInputValue("#ABC")).toBe("#aabbcc");
    expect(toColorInputValue("#C8A27A")).toBe("#c8a27a");
  });

  it("falls back on anything else", () => {
    expect(toColorInputValue("red")).toBe("#cccccc");
    expect(toColorInputValue("#12", "#000000")).toBe("#000000");
  });
});
