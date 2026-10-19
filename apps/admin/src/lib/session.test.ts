import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieHeader = vi.hoisted(() => ({ value: "gp_admin=abc" }));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ toString: () => cookieHeader.value }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

// `cache` only memoises inside a React server render; here it must just call through.
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));

import { getSession, requireOwner } from "./session";

function session(role: "owner" | "staff") {
  return {
    user: {
      id: "507f1f77bcf86cd799439011",
      email: "a@giftpop.test",
      name: "A",
      role,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    expiresAt: "2026-01-08T00:00:00.000Z",
  };
}

function respond(status: number, body: unknown) {
  return vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("session helpers", () => {
  beforeEach(() => {
    cookieHeader.value = "gp_admin=abc";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getSession returns the session and forwards the cookie", async () => {
    const fetchMock = respond(200, session("staff"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSession();

    expect(result.user.role).toBe("staff");
    const init = fetchMock.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>).cookie).toBe("gp_admin=abc");
  });

  it("getSession redirects to /login on 401", async () => {
    vi.stubGlobal("fetch", respond(401, { error: { code: "UNAUTHENTICATED", message: "No." } }));
    await expect(getSession()).rejects.toThrow("REDIRECT:/login");
  });

  it("getSession redirects to /login without calling the API when there is no cookie", async () => {
    cookieHeader.value = "";
    const fetchMock = respond(200, session("owner"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSession()).rejects.toThrow("REDIRECT:/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requireOwner lets an owner through", async () => {
    vi.stubGlobal("fetch", respond(200, session("owner")));
    expect((await requireOwner()).user.role).toBe("owner");
  });

  it("requireOwner sends staff to the dashboard", async () => {
    vi.stubGlobal("fetch", respond(200, session("staff")));
    await expect(requireOwner()).rejects.toThrow("REDIRECT:/");
  });
});
