import request from "supertest";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import type { Storage } from "../../lib/storage";

import { createAssetsRouter } from "./router";

// No mock here: this file runs against the real `requireStaff`, so it fails if an
// asset route is ever mounted without it. No database is needed for anonymous calls.
const storage: Storage = {
  put: () => Promise.reject(new Error("must not store anything")),
  delete: () => Promise.resolve(),
  publicUrl: (key) => key,
};
const app = createTestApp([{ path: "/assets", router: createAssetsRouter(() => storage) }]);

describe("assets routes with the real session check", () => {
  it("POST /v1/assets rejects anonymous callers with 401", async () => {
    const res = await request(app)
      .post("/v1/assets")
      .attach("file", Buffer.from("anything"), { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("PATCH /v1/assets/:id rejects anonymous callers with 401", async () => {
    const res = await request(app)
      .patch(`/v1/assets/${"a".repeat(24)}`)
      .send({ anchor: { x: 0.5, y: 0.5 } });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});
