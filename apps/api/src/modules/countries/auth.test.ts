// No mock here: this runs against the real `requireStaff`, which must turn anonymous
// requests away. (Today it is a deny-all stub; the real one also answers 401 without a cookie.)
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";

import { makeCountry } from "./fixtures";
import { countriesRouter } from "./router";

const app = createTestApp([{ path: "/countries", router: countriesRouter }]);

describe("countries admin routes without a session", () => {
  it.each([
    ["get", "/v1/countries/admin"],
    ["post", "/v1/countries"],
    ["put", "/v1/countries/PK"],
  ] as const)("%s %s answers 401", async (method, path) => {
    const res = await request(app)[method](path).send(makeCountry());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
