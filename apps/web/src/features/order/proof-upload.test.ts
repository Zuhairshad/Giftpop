import { describe, expect, it } from "vitest";

import { ProofUploadError, describeUploadError, uploadProof } from "./proof-upload";

const file = new File([new Uint8Array([1, 2, 3])], "proof.png", { type: "image/png" });
const proof = {
  id: "507f1f77bcf86cd799439011",
  status: "pending",
  uploadedAt: "2026-10-19T10:00:00.000Z",
};

type Seen = { url?: string; form?: FormData };

function fakeFetch(status: number, body: unknown, seen?: Seen): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    if (seen) {
      seen.url = url;
      seen.form = init?.body as FormData;
    }
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

describe("describeUploadError", () => {
  it("maps each API status to its own message", () => {
    const messages = [404, 409, 413, 415, 429, 0, 500].map((s) =>
      describeUploadError(new ProofUploadError(s)),
    );
    expect(new Set(messages).size).toBe(messages.length);
    expect(describeUploadError(new Error("x"))).toBe(
      describeUploadError(new ProofUploadError(500)),
    );
  });
});

describe("uploadProof", () => {
  const base = { number: "GP-PK-7K2M9Q", contact: "a@b.co", file };

  it("posts multipart with contact and file and parses the response", async () => {
    const seen: Seen = {};
    const result = await uploadProof({ ...base, fetch: fakeFetch(201, { proof }, seen) });
    expect(result.proof.status).toBe("pending");
    expect(seen.url).toBe("/api/orders/GP-PK-7K2M9Q/payment-proof");
    expect(seen.form?.get("contact")).toBe("a@b.co");
    expect(seen.form?.get("file")).toBeInstanceOf(File);
  });
  it("throws the API status", async () => {
    await expect(
      uploadProof({ ...base, fetch: fakeFetch(409, { error: {} }) }),
    ).rejects.toMatchObject({
      status: 409,
    });
  });
  it("throws -1 for an unexpected body and 0 for no response", async () => {
    await expect(
      uploadProof({ ...base, fetch: fakeFetch(201, { nope: 1 }) }),
    ).rejects.toMatchObject({
      status: -1,
    });
    const failing = (async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch;
    await expect(uploadProof({ ...base, fetch: failing })).rejects.toMatchObject({ status: 0 });
  });
});
