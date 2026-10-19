// No mock here: this runs against the real `requireStaff`, which must turn anonymous
// requests away on every admin route.
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";

import { makeItem, makePackaging } from "./fixtures";
import { catalogRouter } from "./router";

const app = createTestApp([{ path: "/catalog", router: catalogRouter }]);
const id = "a".repeat(24);

const routes = [
  ["get", "/v1/catalog/admin/categories"],
  ["get", "/v1/catalog/admin/items"],
  ["post", "/v1/catalog/admin/items"],
  ["get", `/v1/catalog/admin/items/${id}`],
  ["put", `/v1/catalog/admin/items/${id}`],
  ["get", `/v1/catalog/admin/items/${id}/prices`],
  ["put", `/v1/catalog/admin/items/${id}/prices`],
  ["get", "/v1/catalog/admin/packagings"],
  ["post", "/v1/catalog/admin/packagings"],
  ["get", `/v1/catalog/admin/packagings/${id}`],
  ["put", `/v1/catalog/admin/packagings/${id}`],
  ["get", `/v1/catalog/admin/packagings/${id}/prices`],
  ["put", `/v1/catalog/admin/packagings/${id}/prices`],
  ["get", "/v1/catalog/admin/anything-else"],
] as const;

describe("catalog admin routes without a session", () => {
  it.each(routes)("%s %s answers 401", async (method, path) => {
    const agent = request(app);
    const res = await agent[method](path).send({ ...makeItem(), ...makePackaging() });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
