import { Router } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { requireStaff } from "../../middleware/require-staff";
import { StaffModel } from "../staff/model";

import { loginAs, seedStaff } from "./auth.test-utils";
import { SessionModel } from "./model";
import { resetLoginRateLimit } from "./rate-limit";
import { authRouter } from "./router";

useTestMongo();

const guarded = Router();
guarded.get("/any", requireStaff(), (req, res) => {
  res.json({ id: req.staff?.id, role: req.staff?.role });
});
guarded.get("/staff", requireStaff("staff"), (req, res) => {
  res.json({ role: req.staff?.role });
});
guarded.get("/owner", requireStaff("owner"), (req, res) => {
  res.json({ role: req.staff?.role });
});

const app = createTestApp([
  { path: "/auth", router: authRouter },
  { path: "/guarded", router: guarded },
]);

beforeAll(async () => {
  await Promise.all([StaffModel.init(), SessionModel.init()]);
});

beforeEach(async () => {
  await clearDatabase();
  resetLoginRateLimit();
});

describe("requireStaff", () => {
  it("returns 401 UNAUTHENTICATED without a session", async () => {
    for (const path of ["any", "staff", "owner"]) {
      const res = await request(app).get(`/v1/guarded/${path}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("sets req.staff for any role when no role is required", async () => {
    const staff = await seedStaff({ role: "staff" });
    const cookie = await loginAs(app, staff.email);
    const res = await request(app).get("/v1/guarded/any").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: staff.id, role: "staff" });
  });

  it('lets owners and staff through "staff" routes', async () => {
    const owner = await seedStaff({ email: "o@giftpop.test", role: "owner" });
    const staff = await seedStaff({ email: "s@giftpop.test", role: "staff" });
    for (const email of [owner.email, staff.email]) {
      const cookie = await loginAs(app, email);
      const res = await request(app).get("/v1/guarded/staff").set("Cookie", cookie);
      expect(res.status).toBe(200);
    }
  });

  it('returns 403 FORBIDDEN for staff on "owner" routes and 200 for owners', async () => {
    const owner = await seedStaff({ email: "o@giftpop.test", role: "owner" });
    const staff = await seedStaff({ email: "s@giftpop.test", role: "staff" });

    const denied = await request(app)
      .get("/v1/guarded/owner")
      .set("Cookie", await loginAs(app, staff.email));
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("FORBIDDEN");

    const allowed = await request(app)
      .get("/v1/guarded/owner")
      .set("Cookie", await loginAs(app, owner.email));
    expect(allowed.status).toBe(200);
  });

  it("returns 401, not 403, when the session is expired", async () => {
    const staff = await seedStaff({ role: "staff" });
    const cookie = await loginAs(app, staff.email);
    await SessionModel.updateMany({}, { expiresAt: new Date(Date.now() - 1) });
    const res = await request(app).get("/v1/guarded/owner").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the account has been deactivated since sign-in", async () => {
    const staff = await seedStaff({ role: "owner" });
    const cookie = await loginAs(app, staff.email);
    await StaffModel.updateOne({ _id: staff.id }, { active: false });
    const res = await request(app).get("/v1/guarded/any").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });

  it("uses the role stored now, so a demotion applies to live sessions", async () => {
    const owner = await seedStaff({ role: "owner" });
    const cookie = await loginAs(app, owner.email);
    await StaffModel.updateOne({ _id: owner.id }, { role: "staff" });
    const res = await request(app).get("/v1/guarded/owner").set("Cookie", cookie);
    expect(res.status).toBe(403);
  });
});
