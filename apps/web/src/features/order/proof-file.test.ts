import { describe, expect, it } from "vitest";

import { PROOF_MAX_BYTES, validateProofFile } from "./proof-file";

describe("validateProofFile", () => {
  it("accepts png, jpeg and webp up to 5 MB", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateProofFile({ type, size: PROOF_MAX_BYTES })).toEqual({ ok: true });
    }
  });
  it("rejects other types", () => {
    for (const type of ["image/gif", "application/pdf", "image/svg+xml", ""]) {
      expect(validateProofFile({ type, size: 100 }).ok).toBe(false);
    }
  });
  it("rejects empty and oversize files", () => {
    expect(validateProofFile({ type: "image/png", size: 0 }).ok).toBe(false);
    expect(validateProofFile({ type: "image/png", size: PROOF_MAX_BYTES + 1 }).ok).toBe(false);
  });
});
