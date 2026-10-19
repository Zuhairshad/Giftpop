import { StaffUserSchema, type StaffUser } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { loginAs, PASSWORD, seedStaff } from "../auth/auth.test-utils";
import { SessionModel } from "../auth/model";
import { resetLoginRateLimit } from "../auth/rate-limit";

import { StaffModel } from "./model";

useTestMongo();
const app = createTestApp();

beforeAll(async () => {
  await StaffModel.init();
});

beforeEach(async () => {
  await clearDatabase();
  resetLoginRateLimit();
});

const NEW_STAFF = {
  email: "New.Person@giftpop.test",
  name: "New Person",
  role: "staff",
  password: "temporary password 1",
} as const;

async function ownerSession() {
  const owner = await seedStaff({ email: "owner@giftpop.test", name: "Olive", role: "owner" });
  return { owner, cookie: await loginAs(app, owner.email) };
}

async function staffSession() {
  const staff = await seedStaff({ email: "staff@giftpop.test", name: "Sam", role: "staff" });
  return { staff, cookie: await loginAs(app, staff.email) };
}

describe("anonymous access", () => {
  const someId = "64b7f0c2a1b2c3d4e5f60718";

  it("is rejected with 401 on every staff route", async () => {
    const responses = await Promise.all([
      request(app).get("/v1/staff"),
      request(app).post("/v1/staff").send(NEW_STAFF),
      request(app).patch(`/v1/staff/${someId}`).send({ name: "x" }),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    }
    expect(await StaffModel.countDocuments()).toBe(0);
  });
});

describe("staff role", () => {
  it("is rejected with 403 on every staff route", async () => {
    const { staff, cookie } = await staffSession();
    const responses = await Promise.all([
      request(app).get("/v1/staff").set("Cookie", cookie),
      request(app).post("/v1/staff").set("Cookie", cookie).send(NEW_STAFF),
      request(app).patch(`/v1/staff/${staff.id}`).set("Cookie", cookie).send({ role: "owner" }),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    }
    const stored = await StaffModel.findById(staff.id);
    expect(stored?.role).toBe("staff");
  });
});

describe("GET /v1/staff", () => {
  it("lists every account without any hash", async () => {
    const { cookie } = await ownerSession();
    await seedStaff({ email: "staff@giftpop.test", active: false });

    const res = await request(app).get("/v1/staff").set("Cookie", cookie);

    expect(res.status).toBe(200);
    const list: StaffUser[] = StaffUserSchema.array().parse(res.body);
    expect(list.map((s) => s.email)).toEqual(["owner@giftpop.test", "staff@giftpop.test"]);
    expect(list[1]?.active).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
  });
});

describe("POST /v1/staff", () => {
  it("creates an account that can sign in, without returning the hash", async () => {
    const { cookie } = await ownerSession();

    const res = await request(app).post("/v1/staff").set("Cookie", cookie).send(NEW_STAFF);

    expect(res.status).toBe(201);
    const created = StaffUserSchema.parse(res.body);
    expect(created).toMatchObject({
      email: "new.person@giftpop.test",
      name: "New Person",
      role: "staff",
      active: true,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2|temporary password/);

    const stored = await StaffModel.findById(created.id);
    expect(stored?.passwordHash.startsWith("$argon2id$")).toBe(true);
    await loginAs(app, "new.person@giftpop.test", NEW_STAFF.password);
  });

  it("returns 409 for a duplicate email, ignoring case", async () => {
    const { cookie } = await ownerSession();
    await request(app).post("/v1/staff").set("Cookie", cookie).send(NEW_STAFF).expect(201);

    const res = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .send({ ...NEW_STAFF, email: "new.person@GIFTPOP.test" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects a short password and an unknown role", async () => {
    const { cookie } = await ownerSession();
    const short = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .send({ ...NEW_STAFF, password: "short" });
    const badRole = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .send({ ...NEW_STAFF, role: "admin" });
    expect(short.status).toBe(400);
    expect(short.body.error.code).toBe("VALIDATION_ERROR");
    expect(badRole.status).toBe(400);
  });
});

describe("PATCH /v1/staff/:id", () => {
  async function createdStaff(ownerCookie: string): Promise<StaffUser> {
    const res = await request(app).post("/v1/staff").set("Cookie", ownerCookie).send(NEW_STAFF);
    return StaffUserSchema.parse(res.body);
  }

  it("updates name and role", async () => {
    const { cookie } = await ownerSession();
    const target = await createdStaff(cookie);

    const res = await request(app)
      .patch(`/v1/staff/${target.id}`)
      .set("Cookie", cookie)
      .send({ name: "Renamed", role: "owner" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: target.id, name: "Renamed", role: "owner" });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
  });

  it("deactivating a user deletes their sessions and blocks sign-in", async () => {
    const { cookie } = await ownerSession();
    const target = await createdStaff(cookie);
    const targetCookie = await loginAs(app, target.email, NEW_STAFF.password);
    expect((await request(app).get("/v1/auth/me").set("Cookie", targetCookie)).status).toBe(200);

    const res = await request(app)
      .patch(`/v1/staff/${target.id}`)
      .set("Cookie", cookie)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
    expect(await SessionModel.countDocuments({ staffId: target.id })).toBe(0);
    expect((await request(app).get("/v1/auth/me").set("Cookie", targetCookie)).status).toBe(401);
    const login = await request(app)
      .post("/v1/auth/login")
      .send({ email: target.email, password: NEW_STAFF.password });
    expect(login.status).toBe(401);
  });

  it("setting a new password signs the user out everywhere", async () => {
    const { cookie } = await ownerSession();
    const target = await createdStaff(cookie);
    const oldCookie = await loginAs(app, target.email, NEW_STAFF.password);

    await request(app)
      .patch(`/v1/staff/${target.id}`)
      .set("Cookie", cookie)
      .send({ password: "another temporary one" })
      .expect(200);

    expect((await request(app).get("/v1/auth/me").set("Cookie", oldCookie)).status).toBe(401);
    await loginAs(app, target.email, "another temporary one");
  });

  it("lets an owner change their own password without losing their session", async () => {
    const { owner, cookie } = await ownerSession();
    const other = await loginAs(app, owner.email);

    await request(app)
      .patch(`/v1/staff/${owner.id}`)
      .set("Cookie", cookie)
      .send({ password: "my brand new password" })
      .expect(200);

    expect((await request(app).get("/v1/auth/me").set("Cookie", cookie)).status).toBe(200);
    expect((await request(app).get("/v1/auth/me").set("Cookie", other)).status).toBe(401);
    expect(PASSWORD).not.toBe("my brand new password");
  });

  it("stops an owner deactivating or demoting themselves", async () => {
    const { owner, cookie } = await ownerSession();

    const deactivate = await request(app)
      .patch(`/v1/staff/${owner.id}`)
      .set("Cookie", cookie)
      .send({ active: false });
    const demote = await request(app)
      .patch(`/v1/staff/${owner.id}`)
      .set("Cookie", cookie)
      .send({ role: "staff" });

    expect(deactivate.status).toBe(409);
    expect(demote.status).toBe(409);
    const stored = await StaffModel.findById(owner.id);
    expect(stored).toMatchObject({ active: true, role: "owner" });
    expect((await request(app).get("/v1/auth/me").set("Cookie", cookie)).status).toBe(200);
  });

  it("allows an owner to re-save themselves with unchanged role and active", async () => {
    const { owner, cookie } = await ownerSession();
    const res = await request(app)
      .patch(`/v1/staff/${owner.id}`)
      .set("Cookie", cookie)
      .send({ role: "owner", active: true, name: "Olive Owner" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Olive Owner");
  });

  it("returns 404 for an unknown id and 400 for a malformed one", async () => {
    const { cookie } = await ownerSession();
    const missing = await request(app)
      .patch("/v1/staff/64b7f0c2a1b2c3d4e5f60718")
      .set("Cookie", cookie)
      .send({ name: "Ghost" });
    const malformed = await request(app)
      .patch("/v1/staff/not-an-id")
      .set("Cookie", cookie)
      .send({ name: "Ghost" });
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  it("rejects an invalid body", async () => {
    const { owner, cookie } = await ownerSession();
    const other = await seedStaff({ email: "other@giftpop.test" });
    const res = await request(app)
      .patch(`/v1/staff/${other.id}`)
      .set("Cookie", cookie)
      .send({ password: "short" });
    expect(res.status).toBe(400);
    expect(owner.id).not.toBe(other.id);
  });
});
