import { describe, expect, it, vi } from "vitest";

import { uploadAsset } from "./client";
import { ItemResponseSchema, PackagingListSchema } from "./schemas";

import { ApiError } from "@/lib/api";

const record = {
  id: "c".repeat(24),
  url: "https://cdn.test/a.webp",
  width: 100,
  height: 200,
  anchor: { x: 0.5, y: 1 },
  createdAt: "2026-01-01T00:00:00.000Z",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("uploadAsset", () => {
  const file = new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });

  it("posts multipart form data with the session cookie and parses the asset", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(json({ asset: record }, 201)));
    const asset = await uploadAsset(file, { fetchImpl, baseUrl: "http://api.test/v1" });

    expect(asset).toEqual(record);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("http://api.test/v1/assets");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("file")).toBeInstanceOf(File);
    // The browser sets the multipart boundary; a manual Content-Type would break it.
    expect(init?.headers).not.toHaveProperty("Content-Type");
  });

  it("turns an API error into an ApiError", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(json({ error: { code: "VALIDATION_ERROR", message: "Wrong type" } }, 400)),
    );
    await expect(uploadAsset(file, { fetchImpl, baseUrl: "/api" })).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Wrong type",
    });
  });

  it("rejects an answer in the wrong shape", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(json({ asset: { id: 1 } })));
    await expect(uploadAsset(file, { fetchImpl, baseUrl: "/api" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("reports a network failure", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.reject(new TypeError("offline")));
    const error: unknown = await uploadAsset(file, { fetchImpl, baseUrl: "/api" }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
  });
});

describe("response schemas", () => {
  const item = {
    id: "a".repeat(24),
    name: "Mug",
    category: "care",
    shape: "mug",
    color: "#ffffff",
    sizeUnits: 1,
    personalizable: false,
    active: true,
    sortOrder: 0,
  };

  it("accepts a bare or a wrapped item", () => {
    expect(ItemResponseSchema.parse(item).name).toBe("Mug");
    expect(ItemResponseSchema.parse({ item }).name).toBe("Mug");
  });

  it("accepts a bare or a paginated packaging list", () => {
    expect(PackagingListSchema.parse([])).toEqual([]);
    expect(PackagingListSchema.parse({ items: [], page: 1, pageSize: 20, total: 0 })).toEqual([]);
  });
});
