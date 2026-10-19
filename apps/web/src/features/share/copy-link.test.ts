import { describe, expect, it, vi } from "vitest";

import { copyLink, copyMessage } from "./copy-link";

describe("copyLink", () => {
  it("copies with the Clipboard API when it works", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyLink("https://x.test/g/abc", { writeText })).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://x.test/g/abc");
  });

  it("falls back to manual copy when there is no Clipboard API", async () => {
    await expect(copyLink("link", undefined)).resolves.toBe("manual");
  });

  it("falls back to manual copy when the API has no writeText", async () => {
    const broken = {} as unknown as { writeText(text: string): Promise<void> };
    await expect(copyLink("link", broken)).resolves.toBe("manual");
  });

  it("falls back to manual copy when the browser refuses", async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    await expect(copyLink("link", { writeText })).resolves.toBe("manual");
  });

  it("falls back when writeText throws synchronously", async () => {
    const writeText = vi.fn(() => {
      throw new Error("boom");
    });
    await expect(copyLink("link", { writeText })).resolves.toBe("manual");
  });
});

describe("copyMessage", () => {
  it("confirms a copy", () => {
    expect(copyMessage("copied")).toBe("Link copied.");
  });
  it("tells the visitor what to do after a fallback", () => {
    expect(copyMessage("manual")).toMatch(/selected/);
    expect(copyMessage("manual")).toMatch(/Ctrl\+C/);
  });
});
