import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, apiFetch, isApiError } from "./api";

const PingSchema = z.object({ ok: z.literal(true) });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(response: Response | Error) {
  return vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
}

const baseUrl = "http://api.test/v1";

describe("apiFetch", () => {
  it("parses a successful response with the schema", async () => {
    const fetchImpl = mockFetch(jsonResponse({ ok: true }));
    await expect(apiFetch("/ping", PingSchema, { fetchImpl, baseUrl })).resolves.toEqual({
      ok: true,
    });
  });

  it("sends credentials, the right URL and a JSON body", async () => {
    const fetchImpl = mockFetch(jsonResponse({ ok: true }));
    await apiFetch("ping", PingSchema, {
      fetchImpl,
      baseUrl: `${baseUrl}/`,
      method: "POST",
      body: { a: 1 },
    });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("http://api.test/v1/ping");
    expect(init?.credentials).toBe("include");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"a":1}');
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("does not set a body or content type on a GET", async () => {
    const fetchImpl = mockFetch(jsonResponse({ ok: true }));
    await apiFetch("/ping", PingSchema, { fetchImpl, baseUrl });
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("throws a typed ApiError from the ErrorResponse shape", async () => {
    const fetchImpl = mockFetch(
      jsonResponse(
        { error: { code: "UNAUTHENTICATED", message: "Sign in first.", details: { a: 1 } } },
        401,
      ),
    );
    const error = await apiFetch("/ping", PingSchema, { fetchImpl, baseUrl }).catch(
      (e: unknown) => e,
    );
    expect(isApiError(error)).toBe(true);
    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.status).toBe(401);
      expect(error.code).toBe("UNAUTHENTICATED");
      expect(error.message).toBe("Sign in first.");
      expect(error.details).toEqual({ a: 1 });
    }
  });

  it("throws UNEXPECTED_RESPONSE when an error body is not an ErrorResponse", async () => {
    const fetchImpl = mockFetch(new Response("<html>bad gateway</html>", { status: 502 }));
    await expect(apiFetch("/ping", PingSchema, { fetchImpl, baseUrl })).rejects.toMatchObject({
      status: 502,
      code: "UNEXPECTED_RESPONSE",
    });
  });

  it("throws INVALID_RESPONSE when the success body fails the schema", async () => {
    const fetchImpl = mockFetch(jsonResponse({ ok: false }));
    await expect(apiFetch("/ping", PingSchema, { fetchImpl, baseUrl })).rejects.toMatchObject({
      status: 200,
      code: "INVALID_RESPONSE",
    });
  });

  it("throws NETWORK_ERROR when fetch rejects", async () => {
    const fetchImpl = mockFetch(new TypeError("fetch failed"));
    await expect(apiFetch("/ping", PingSchema, { fetchImpl, baseUrl })).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });

  it("accepts an empty body when the schema allows it", async () => {
    const fetchImpl = mockFetch(new Response(null, { status: 204 }));
    await expect(
      apiFetch("/logout", z.undefined(), { fetchImpl, baseUrl, method: "POST" }),
    ).resolves.toBeUndefined();
  });
});
