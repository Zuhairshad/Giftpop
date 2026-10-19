import { ASSET_MAX_BYTES } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { imageFileProblem } from "./image-file";

describe("imageFileProblem", () => {
  it("accepts png, webp and jpeg within the size limit", () => {
    for (const type of ["image/png", "image/webp", "image/jpeg"]) {
      expect(imageFileProblem({ type, size: 1000 })).toBeNull();
    }
    expect(imageFileProblem({ type: "image/png", size: ASSET_MAX_BYTES })).toBeNull();
  });

  it("rejects other types", () => {
    expect(imageFileProblem({ type: "image/gif", size: 1000 })).toMatch(/PNG, WebP or JPEG/);
    expect(imageFileProblem({ type: "", size: 1000 })).toMatch(/PNG, WebP or JPEG/);
  });

  it("rejects oversize and empty files", () => {
    expect(imageFileProblem({ type: "image/png", size: ASSET_MAX_BYTES + 1 })).toMatch(/8 MB/);
    expect(imageFileProblem({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
});
