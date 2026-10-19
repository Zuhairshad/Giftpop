import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { useTestMongo } from "../../../test/mongo";
import { initCatalogModels } from "../quotes/fixtures";

import { templatesRouter } from "./router";

// No mock here: this is the real staff guard.
useTestMongo();
beforeAll(async () => {
  await initCatalogModels();
});

const app = createTestApp([{ path: "/templates", router: templatesRouter }]);
const ID = "a".repeat(24);

describe("real staff guard", () => {
  it("rejects anonymous callers with 401 on every admin route", async () => {
    const calls = [
      request(app).get("/v1/templates/admin"),
      request(app).post("/v1/templates/admin").send({}),
      request(app).patch(`/v1/templates/admin/${ID}`).send({}),
      request(app).delete(`/v1/templates/admin/${ID}`),
    ];
    for (const call of calls) {
      const res = await call;
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    }
  });
});
