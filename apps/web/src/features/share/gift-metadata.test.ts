import { describe, expect, it } from "vitest";

import {
  buildShareMetadata,
  DESCRIPTION_MAX_LENGTH,
  shareDescription,
  shareTitle,
  truncateText,
} from "./gift-metadata";
import { makeSharedView } from "./shared-view.fixture";

describe("truncateText", () => {
  it("leaves short text alone", () => {
    expect(truncateText("Hello", 150)).toBe("Hello");
  });

  it("keeps text of exactly the limit", () => {
    const text = "a".repeat(150);
    expect(truncateText(text, 150)).toBe(text);
  });

  it("cuts long text to the limit, counting the ellipsis", () => {
    const result = truncateText("a".repeat(400), 150);
    expect(Array.from(result)).toHaveLength(150);
    expect(result.endsWith("…")).toBe(true);
  });

  it("collapses whitespace and newlines", () => {
    expect(truncateText("  Happy\n\nbirthday   Sara ", 150)).toBe("Happy birthday Sara");
  });

  it("never splits an emoji", () => {
    const result = truncateText("🎁".repeat(200), 10);
    expect(Array.from(result)).toHaveLength(10);
    expect(result).toBe(`${"🎁".repeat(9)}…`);
  });
});

describe("shareTitle and shareDescription", () => {
  it("names the recipient", () => {
    expect(shareTitle("Sara")).toBe("A gift for Sara");
    expect(shareTitle("  Sara  ")).toBe("A gift for Sara");
  });

  it("falls back without a recipient", () => {
    expect(shareTitle("")).toBe("A Giftpop gift");
    expect(shareTitle("   ")).toBe("A Giftpop gift");
  });

  it("uses the card message, truncated", () => {
    expect(shareDescription("Happy birthday!")).toBe("Happy birthday!");
    expect(Array.from(shareDescription("x".repeat(200))).length).toBe(DESCRIPTION_MAX_LENGTH);
  });

  it("falls back to a plain sentence without a message", () => {
    expect(shareDescription("")).toMatch(/The Giftpop/);
  });
});

describe("buildShareMetadata", () => {
  it("fills title, description, Open Graph and Twitter", () => {
    const meta = buildShareMetadata(makeSharedView());
    expect(meta.title).toBe("A gift for Sara");
    expect(meta.description).toBe("Happy birthday!");
    expect(meta.openGraph).toMatchObject({
      title: "A gift for Sara | The Giftpop",
      description: "Happy birthday!",
    });
    expect(meta.twitter).toMatchObject({ title: "A gift for Sara | The Giftpop" });
    expect(meta.robots).toMatchObject({ index: false });
  });

  it("uses the generic title when there is no recipient", () => {
    const base = makeSharedView();
    const view = makeSharedView({
      design: {
        ...base.design,
        personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
      },
    });
    const meta = buildShareMetadata(view);
    expect(meta.title).toBe("A Giftpop gift");
    expect(meta.description).toMatch(/Someone made this gift/);
  });
});
