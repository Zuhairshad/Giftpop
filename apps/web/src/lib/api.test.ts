import { CountrySummarySchema } from "@giftpop/contracts";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, ApiNetworkError, ApiSchemaError, apiRequest } from "./api";

const BASE = "http://api.test/v1";
const CountryList = z.array(CountrySummarySchema);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  it("returns data parsed by the contract schema", async () => {
    const countries = [{ code: "PK", name: "Pakistan", currency: "PKR", status: "live" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(countries));

    const result = await apiRequest("/countries", CountryList, { baseUrl: BASE, fetch: fetchMock });

    expect(result).toEqual(countries);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/countries");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("sends a JSON body with the right headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

    await apiRequest("orders", z.object({ ok: z.boolean() }), {
      method: "POST",
      body: { hello: "world" },
      headers: { "Idempotency-Key": "abc" },
      baseUrl: `${BASE}/`,
      fetch: fetchMock,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/orders");
    expect(init.body).toBe('{"hello":"world"}');
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "Idempotency-Key": "abc",
    });
  });

  it("throws ApiError carrying the contract error shape", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { error: { code: "NOT_FOUND", message: "No such country", details: { code: "ZZ" } } },
          404,
        ),
      );

    const error = await apiRequest("/countries/ZZ", CountryList, {
      baseUrl: BASE,
      fetch: fetchMock,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe("NOT_FOUND");
    expect(apiError.message).toBe("No such country");
    expect(apiError.details).toEqual({ code: "ZZ" });
  });

  it("throws ApiSchemaError when a failed response is not the error shape", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));

    await expect(
      apiRequest("/countries", CountryList, { baseUrl: BASE, fetch: fetchMock }),
    ).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it("throws ApiSchemaError when the success body does not match the schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ code: "PK" }]));

    const error = await apiRequest("/countries", CountryList, {
      baseUrl: BASE,
      fetch: fetchMock,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiSchemaError);
    expect((error as ApiSchemaError).issues.length).toBeGreaterThan(0);
  });

  it("throws ApiSchemaError when a success body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("nope", { status: 200 }));

    await expect(
      apiRequest("/countries", CountryList, { baseUrl: BASE, fetch: fetchMock }),
    ).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it("throws ApiNetworkError when fetch rejects", async () => {
    const cause = new TypeError("fetch failed");
    const fetchMock = vi.fn().mockRejectedValue(cause);

    const error = await apiRequest("/countries", CountryList, {
      baseUrl: BASE,
      fetch: fetchMock,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiNetworkError);
    expect((error as ApiNetworkError).cause).toBe(cause);
  });

  it("accepts an empty body when the schema allows it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest("/something", z.undefined(), {
      method: "DELETE",
      baseUrl: BASE,
      fetch: fetchMock,
    });

    expect(result).toBeUndefined();
  });
});
