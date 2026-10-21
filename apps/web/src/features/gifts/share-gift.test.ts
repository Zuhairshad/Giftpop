import { describe, expect, it, vi } from "vitest";

import { giftSharePayload, shareGift, shareMessage } from "./share-gift";

const URL = "https://shop.example/g/gift-bday-choc-bouquet";
const PAYLOAD = giftSharePayload({ title: "Birthday box", description: "Sweet things" }, URL);

describe("giftSharePayload", () => {
  it("carries the title, the description and the link", () => {
    expect(PAYLOAD).toEqual({ title: "Birthday box", text: "Sweet things", url: URL });
  });

  it("uses a plain sentence when the gift has no description", () => {
    expect(giftSharePayload({ title: "x", description: "  " }, URL).text).toMatch(/Giftpop/);
  });
});

describe("shareGift", () => {
  it("uses the share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareGift({ share }, PAYLOAD)).toBe("shared");
    expect(share).toHaveBeenCalledWith(PAYLOAD);
  });

  it("calls a closed share sheet cancelled, and does not copy", async () => {
    const writeText = vi.fn();
    const share = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("closed"), { name: "AbortError" }));
    expect(await shareGift({ share, clipboard: { writeText } }, PAYLOAD)).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link when the share sheet fails for another reason", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const share = vi.fn().mockRejectedValue(new Error("not allowed"));
    expect(await shareGift({ share, clipboard: { writeText } }, PAYLOAD)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(URL);
  });

  it("copies the link when there is no share sheet", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareGift({ clipboard: { writeText } }, PAYLOAD)).toBe("copied");
  });

  it("asks the visitor to copy by hand when nothing works", async () => {
    expect(await shareGift({}, PAYLOAD)).toBe("manual");
  });
});

describe("shareMessage", () => {
  it("says what happened, and nothing after a share sheet", () => {
    expect(shareMessage("copied", URL)).toBe("Link copied.");
    expect(shareMessage("manual", URL)).toContain(URL);
    expect(shareMessage("shared", URL)).toBe("");
    expect(shareMessage("cancelled", URL)).toBe("");
  });
});
