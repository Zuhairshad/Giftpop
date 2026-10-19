import { describe, expect, it, vi } from "vitest";

import { fetchSession } from "./fetch-session";

import { isApiError } from "@/lib/api";

const SESSION = {
  user: {
    id: "507f1f77bcf86cd799439011",
    email: "owner@giftpop.test",
    name: "Owner",
    role: "owner",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  expiresAt: "2026-01-08T00:00:00.000Z",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchSession", () => {
  it("forwards the cookie to /auth/me and returns the session", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, SESSION));
    const session = await fetchSession("gp_admin=abc", fetchImpl);

    expect(session?.user.email).toBe("owner@giftpop.test");
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/v1\/auth\/me$/);
    expect((init?.headers as Record<string, string>).cookie).toBe("gp_admin=abc");
  });

  it("returns null on 401", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(401, { error: { code: "UNAUTHENTICATED", message: "No." } }));
    expect(await fetchSession("gp_admin=stale", fetchImpl)).toBeNull();
  });

  it("throws on a server error instead of signing the person out", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(500, {}));
    await expect(fetchSession("gp_admin=abc", fetchImpl)).rejects.toSatisfy(isApiError);
  });

  it("throws when the API is unreachable", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchSession("gp_admin=abc", fetchImpl)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });

  it("throws when the session has an unexpected shape", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { user: null }));
    await expect(fetchSession("gp_admin=abc", fetchImpl)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});
