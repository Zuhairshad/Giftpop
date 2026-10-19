import { SessionSchema, STAFF_COOKIE_NAME } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { StaffModel } from "../staff/model";

import { loginAs, PASSWORD, seedStaff } from "./auth.test-utils";
import { sessionCookieOptions } from "./cookie";
import { SessionModel } from "./model";
import { resetLoginRateLimit } from "./rate-limit";
import { createOwner } from "./service";
import { hashToken } from "./sessions";

useTestMongo();
const app = createTestApp();

beforeAll(async () => {
  await Promise.all([StaffModel.init(), SessionModel.init()]);
});

beforeEach(async () => {
  await clearDatabase();
  resetLoginRateLimit();
});

describe("POST /v1/auth/login", () => {
  it("signs in, returns the session and sets a hardened cookie", async () => {
    await seedStaff({ email: "owner@giftpop.test", role: "owner" });

    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "owner@giftpop.test", password: PASSWORD });

    expect(res.status).toBe(200);
    const session = SessionSchema.parse(res.body);
    expect(session.user).toMatchObject({
      email: "owner@giftpop.test",
      role: "owner",
      active: true,
    });
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(new Date(session.expiresAt).getTime() - Date.now()).toBeGreaterThan(sevenDays - 60_000);

    const cookie = (res.headers["set-cookie"] as unknown as string[])[0] ?? "";
    expect(cookie.startsWith(`${STAFF_COOKIE_NAME}=`)).toBe(true);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=604800");
    expect(cookie).not.toContain("Secure");
  });

  it("stores only a keyed hash of the token", async () => {
    const staff = await seedStaff();
    const cookie = await loginAs(app, staff.email);
    const token = cookie.slice(STAFF_COOKIE_NAME.length + 1);

    const sessions = await SessionModel.find().lean();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.tokenHash).toBe(hashToken(token));
    expect(sessions[0]?.tokenHash).not.toContain(token);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("matches emails case-insensitively", async () => {
    await seedStaff({ email: "mixed@giftpop.test" });
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "Mixed@Giftpop.TEST", password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it("gives an identical response for an unknown email and a wrong password", async () => {
    await seedStaff({ email: "real@giftpop.test" });

    const wrongPassword = await request(app)
      .post("/v1/auth/login")
      .send({ email: "real@giftpop.test", password: "not the password" });
    const unknownEmail = await request(app)
      .post("/v1/auth/login")
      .send({ email: "nobody@giftpop.test", password: "not the password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(unknownEmail.body).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Email or password is wrong" },
    });
    expect(unknownEmail.headers["set-cookie"]).toBeUndefined();
    expect(wrongPassword.headers["set-cookie"]).toBeUndefined();
  });

  it("gives the same error for an inactive account, even with the right password", async () => {
    await seedStaff({ email: "gone@giftpop.test", active: false });
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "gone@giftpop.test", password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Email or password is wrong" },
    });
  });

  it("rejects a malformed body with a validation error", async () => {
    const res = await request(app).post("/v1/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("allows 5 attempts a minute per IP and email, then returns 429", async () => {
    await seedStaff({ email: "limited@giftpop.test" });
    const attempt = (email: string, password: string) =>
      request(app).post("/v1/auth/login").send({ email, password });

    for (let i = 0; i < 5; i += 1) {
      const res = await attempt("limited@giftpop.test", "wrong password");
      expect(res.status).toBe(401);
    }
    const blocked = await attempt("limited@giftpop.test", "wrong password");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");

    // Even the right password is refused while the bucket is full.
    expect((await attempt("limited@giftpop.test", PASSWORD)).status).toBe(429);
    // The key includes the email, case-insensitively, but other emails have their own bucket.
    expect((await attempt("LIMITED@giftpop.test", PASSWORD)).status).toBe(429);
    expect((await attempt("other@giftpop.test", "wrong password")).status).toBe(401);

    resetLoginRateLimit();
    expect((await attempt("limited@giftpop.test", PASSWORD)).status).toBe(200);
  });
});

describe("GET /v1/auth/me", () => {
  it("returns the session for a valid cookie", async () => {
    const staff = await seedStaff({ email: "me@giftpop.test" });
    const cookie = await loginAs(app, staff.email);

    const res = await request(app).get("/v1/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    const session = SessionSchema.parse(res.body);
    expect(session.user.id).toBe(staff.id);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
  });

  it("returns 401 without a cookie or with a made-up one", async () => {
    const none = await request(app).get("/v1/auth/me");
    expect(none.status).toBe(401);
    expect(none.body.error.code).toBe("UNAUTHENTICATED");

    const forged = await request(app)
      .get("/v1/auth/me")
      .set("Cookie", `${STAFF_COOKIE_NAME}=${"a".repeat(43)}`);
    expect(forged.status).toBe(401);

    const junk = await request(app).get("/v1/auth/me").set("Cookie", `${STAFF_COOKIE_NAME}=junk`);
    expect(junk.status).toBe(401);
  });

  it("rejects an expired session", async () => {
    const staff = await seedStaff();
    const cookie = await loginAs(app, staff.email);
    await SessionModel.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

    const res = await request(app).get("/v1/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });

  it("rejects a session whose staff member was deactivated", async () => {
    const staff = await seedStaff();
    const cookie = await loginAs(app, staff.email);
    await StaffModel.updateOne({ _id: staff.id }, { active: false });

    const res = await request(app).get("/v1/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});

describe("POST /v1/auth/logout", () => {
  it("deletes the session, clears the cookie and invalidates the old cookie", async () => {
    const staff = await seedStaff();
    const cookie = await loginAs(app, staff.email);

    const res = await request(app).post("/v1/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(204);
    const cleared = (res.headers["set-cookie"] as unknown as string[])[0] ?? "";
    expect(cleared.startsWith(`${STAFF_COOKIE_NAME}=;`)).toBe(true);
    expect(cleared).toContain("Expires=Thu, 01 Jan 1970");
    expect(await SessionModel.countDocuments()).toBe(0);

    const after = await request(app).get("/v1/auth/me").set("Cookie", cookie);
    expect(after.status).toBe(401);
  });

  it("only ends the caller's own session", async () => {
    const staff = await seedStaff();
    const first = await loginAs(app, staff.email);
    const second = await loginAs(app, staff.email);

    await request(app).post("/v1/auth/logout").set("Cookie", first);

    expect((await request(app).get("/v1/auth/me").set("Cookie", second)).status).toBe(200);
  });

  it("is a no-op without a session", async () => {
    const res = await request(app).post("/v1/auth/logout");
    expect(res.status).toBe(204);
  });
});

describe("createOwner", () => {
  it("creates an owner and never returns the hash", async () => {
    const owner = await createOwner({
      email: "Boss@Giftpop.test",
      name: "The Boss",
      password: "a long seed password",
    });

    expect(owner).toMatchObject({
      email: "boss@giftpop.test",
      name: "The Boss",
      role: "owner",
      active: true,
    });
    expect(Object.keys(owner).sort()).toEqual([
      "active",
      "createdAt",
      "email",
      "id",
      "name",
      "role",
    ]);
    expect(await loginAs(app, "boss@giftpop.test", "a long seed password")).toContain(
      STAFF_COOKIE_NAME,
    );
  });

  it("is idempotent and leaves an existing account unchanged", async () => {
    const first = await createOwner({
      email: "boss@giftpop.test",
      name: "The Boss",
      password: "a long seed password",
    });
    const second = await createOwner({
      email: "BOSS@giftpop.test",
      name: "Someone Else",
      password: "a different password",
    });

    expect(second).toEqual(first);
    expect(await StaffModel.countDocuments()).toBe(1);
    // The original password still works; the second call did not replace it.
    await loginAs(app, "boss@giftpop.test", "a long seed password");
    const rejected = await request(app)
      .post("/v1/auth/login")
      .send({ email: "boss@giftpop.test", password: "a different password" });
    expect(rejected.status).toBe(401);
  });

  it("returns an existing non-owner account as it is", async () => {
    const staff = await seedStaff({ email: "worker@giftpop.test", role: "staff" });
    const result = await createOwner({
      email: "worker@giftpop.test",
      name: "Worker",
      password: "a long seed password",
    });
    expect(result).toEqual(staff);
  });
});

describe("storage", () => {
  it("keeps a TTL index on expiresAt", async () => {
    const indexes = await SessionModel.collection.indexes();
    expect(indexes.some((i) => i.key.expiresAt === 1 && i.expireAfterSeconds === 0)).toBe(true);
  });

  it("keeps a unique index on staff email", async () => {
    await seedStaff({ email: "dup@giftpop.test" });
    await expect(seedStaff({ email: "DUP@giftpop.test" })).rejects.toMatchObject({ code: 11000 });
  });
});

describe("sessionCookieOptions", () => {
  it("sets Secure only when asked", () => {
    expect(sessionCookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    expect(sessionCookieOptions(false).secure).toBe(false);
  });
});
