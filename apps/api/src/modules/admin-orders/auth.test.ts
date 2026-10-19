// Real session guard, no mocks: every route must turn an anonymous caller away.
import request from "supertest";
import { describe, expect, it } from "vitest";

import { BASE, createAdminApp } from "./admin-orders.test-utils";

const app = createAdminApp();
const id = "a".repeat(24);

const routes = [
  ["get", ""],
  ["get", `/${id}`],
  ["post", `/${id}/status`],
  ["post", `/${id}/payments`],
  ["post", `/${id}/notes`],
  ["patch", `/${id}/proofs/${id}`],
  ["get", "/anything-else"],
] as const;

describe("admin orders without a session", () => {
  it.each(routes)("%s %s answers 401", async (method, path) => {
    const res = await request(app)[method](`${BASE}${path}`).send({
      to: "confirmed",
      text: "hi",
      status: "accepted",
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a made-up cookie", async () => {
    const res = await request(app).get(BASE).set("Cookie", "gp_admin=not-a-real-token");
    expect(res.status).toBe(401);
  });
});
