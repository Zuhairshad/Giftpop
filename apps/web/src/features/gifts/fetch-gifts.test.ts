import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGifts } from "./fetch-gifts";

const ID = "a".repeat(24);

function entry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: ID,
    title: "Birthday joy",
    description: "",
    shareId: "abcDEF12_-",
    country: "PK",
    currency: "PKR",
    design: {
      packagingId: ID,
      items: [],
      wrapperColor: "#ffd3e0",
      ribbonColor: "#e8336d",
      arrangementSeed: 1,
    },
    packaging: {
      id: ID,
      slug: "box",
      name: "Gift box",
      description: "",
      layoutType: "grid",
      minItems: 1,
      maxItems: 10,
      capacityUnits: 20,
      wrapperColors: [{ name: "Blush", hex: "#ffd3e0" }],
      ribbonColors: [{ name: "Pink", hex: "#e8336d" }],
      layers: {},
      active: true,
      sortOrder: 0,
    },
    items: [],
    category: null,
    featured: false,
    priceMinor: 450000,
    itemSummary: { names: [], moreCount: 0 },
    ...over,
  };
}

function answer(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("fetchGifts", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks the API for the country and keeps its order", async () => {
    const fetchMock = vi.fn(async () =>
      answer([entry({ title: "First" }), entry({ title: "Second" })]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGifts("PK");
    expect(result.ok && result.templates.map((t) => t.title)).toEqual(["First", "Second"]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/v1\/templates\?country=PK$/);
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(300);
  });

  it("drops a bad row and a row for another country, keeps the rest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => answer([entry(), { nonsense: true }, entry({ country: "US" })])),
    );
    const result = await fetchGifts("PK");
    expect(result.ok && result.templates).toHaveLength(1);
  });

  it("is an empty list, not a failure, when there are no gifts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => answer([])),
    );
    expect(await fetchGifts("PK")).toEqual({ ok: true, templates: [] });
  });

  it("reports an outage instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }),
    );
    expect(await fetchGifts("PK")).toEqual({ ok: false });
  });

  it("reports a server error and a malformed body as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => answer({ error: { code: "X", message: "boom" } }, 500)),
    );
    expect(await fetchGifts("PK")).toEqual({ ok: false });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => answer({ not: "a list" })),
    );
    expect(await fetchGifts("PK")).toEqual({ ok: false });
  });
});
