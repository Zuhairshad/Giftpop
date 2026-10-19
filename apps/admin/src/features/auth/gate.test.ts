import { describe, expect, it } from "vitest";

import { gateRedirect } from "./gate";

describe("gateRedirect", () => {
  it("lets a request with a session cookie through", () => {
    expect(gateRedirect({ pathname: "/orders", search: "", hasSessionCookie: true })).toBeNull();
  });

  it("sends a request with no cookie to login and remembers the page", () => {
    expect(gateRedirect({ pathname: "/orders", search: "?page=2", hasSessionCookie: false })).toBe(
      "/login?next=%2Forders%3Fpage%3D2",
    );
  });

  it("goes to plain /login from the dashboard home", () => {
    expect(gateRedirect({ pathname: "/", search: "", hasSessionCookie: false })).toBe("/login");
  });

  it("never redirects the login page itself", () => {
    expect(
      gateRedirect({ pathname: "/login", search: "?next=/staff", hasSessionCookie: false }),
    ).toBeNull();
  });
});
