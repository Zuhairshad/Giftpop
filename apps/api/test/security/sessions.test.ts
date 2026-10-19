import { STAFF_COOKIE_NAME } from "@giftpop/contracts";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { resetLoginIpRateLimit } from "../../src/middleware/login-ip-limit";
import { assertStaffOrigin } from "../../src/middleware/staff-origin-guard";
import { loginAs, PASSWORD, seedStaff } from "../../src/modules/auth/auth.test-utils";
import {
  clearSessionCookie,
  sessionCookieOptions,
  setSessionCookie,
} from "../../src/modules/auth/cookie";
import { SessionModel } from "../../src/modules/auth/model";
import { hashPassword } from "../../src/modules/auth/password";
import { resetLoginRateLimit } from "../../src/modules/auth/rate-limit";
import { StaffModel } from "../../src/modules/staff/model";
import { createTestApp } from "../app";
import { clearDatabase, useTestMongo } from "../mongo";

useTestMongo();
beforeEach(async () => {
  await clearDatabase();
  resetLoginRateLimit();
  resetLoginIpRateLimit();
});

const app = createTestApp();

function setCookieOf(res: request.Response): string {
  const header = res.headers["set-cookie"] as unknown as string[] | undefined;
  const line = header?.find((entry) => entry.startsWith(`${STAFF_COOKIE_NAME}=`));
  if (!line) throw new Error("no staff cookie in response");
  return line;
}

describe("session cookie flags", () => {
  it("sets HttpOnly, SameSite=Lax, Path=/ and a max age on login", async () => {
    await seedStaff({ email: "a@giftpop.test" });
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "a@giftpop.test", password: PASSWORD });
    const line = setCookieOf(res);
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Lax/i);
    expect(line).toMatch(/Path=\//);
    expect(line).toMatch(/Max-Age=\d+/i);
    expect(line).not.toMatch(/Domain=/i); // host-only: never shared with sibling subdomains
    // The token is 32 random bytes, and is not the staff id or email.
    expect(line.split(";")[0]?.split("=")[1]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("adds Secure in production (and only then)", () => {
    expect(sessionCookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
    expect(sessionCookieOptions(false).secure).toBe(false);

    const probe = express();
    probe.get("/set", (_req, res) => {
      setSessionCookie(res, "t".repeat(43), true);
      res.end();
    });
    probe.get("/clear", (_req, res) => {
      clearSessionCookie(res, true);
      res.end();
    });
    return request(probe)
      .get("/set")
      .then((res) => {
        expect(setCookieOf(res)).toMatch(/; Secure/i);
        return request(probe).get("/clear");
      })
      .then((res) => {
        const line = setCookieOf(res);
        expect(line).toMatch(/; Secure/i);
        expect(line).toMatch(/HttpOnly/i);
        expect(line).toMatch(/Expires=Thu, 01 Jan 1970/);
      });
  });

  it("logout clears the cookie with matching attributes and kills the session server side", async () => {
    await seedStaff({ email: "a@giftpop.test" });
    const cookie = await loginAs(app, "a@giftpop.test");
    expect((await request(app).get("/v1/auth/me").set("Cookie", cookie)).status).toBe(200);

    const out = await request(app).post("/v1/auth/logout").set("Cookie", cookie);
    expect(out.status).toBe(204);
    const line = setCookieOf(out);
    expect(line).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Lax/i);

    // Replaying the old cookie no longer works.
    expect((await request(app).get("/v1/auth/me").set("Cookie", cookie)).status).toBe(401);
    expect(await SessionModel.countDocuments()).toBe(0);
  });

  it("stores only a hash of the token", async () => {
    await seedStaff({ email: "a@giftpop.test" });
    const cookie = await loginAs(app, "a@giftpop.test");
    const token = cookie.split("=")[1] ?? "";
    const stored = await SessionModel.find().lean();
    expect(stored).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain(token);
  });
});

describe("session fixation", () => {
  it("ignores a cookie sent with the login request and issues a fresh token", async () => {
    await seedStaff({ email: "a@giftpop.test" });
    const planted = `${STAFF_COOKIE_NAME}=${"A".repeat(43)}`;
    const res = await request(app)
      .post("/v1/auth/login")
      .set("Cookie", planted)
      .send({ email: "a@giftpop.test", password: PASSWORD });
    expect(res.status).toBe(200);
    const issued = setCookieOf(res).split(";")[0];
    expect(issued).not.toBe(planted);
    // The attacker's chosen value never became a session.
    expect((await request(app).get("/v1/auth/me").set("Cookie", planted)).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/v1/auth/me")
          .set("Cookie", issued ?? "")
      ).status,
    ).toBe(200);
  });

  it("gives two logins two different tokens", async () => {
    await seedStaff({ email: "a@giftpop.test" });
    const first = await loginAs(app, "a@giftpop.test");
    const second = await loginAs(app, "a@giftpop.test");
    expect(first).not.toBe(second);
  });

  it("rejects malformed or oversize cookie values without a database lookup error", async () => {
    for (const value of ["", "short", "A".repeat(500), "%00%00", "{$ne:1}"]) {
      const res = await request(app)
        .get("/v1/auth/me")
        .set("Cookie", `${STAFF_COOKIE_NAME}=${value}`);
      expect(res.status, value).toBe(401);
    }
  });

  it("stops working when the staff member is deactivated", async () => {
    const staff = await seedStaff({ email: "a@giftpop.test" });
    const cookie = await loginAs(app, "a@giftpop.test");
    await StaffModel.updateOne({ _id: staff.id }, { active: false });
    expect((await request(app).get("/v1/auth/me").set("Cookie", cookie)).status).toBe(401);
  });
});

describe("login enumeration and timing", () => {
  it("answers unknown email, wrong password and inactive account identically", async () => {
    await seedStaff({ email: "real@giftpop.test" });
    await seedStaff({ email: "gone@giftpop.test", active: false });
    const attempts = [
      { email: "nobody@giftpop.test", password: PASSWORD },
      { email: "real@giftpop.test", password: "wrong password here" },
      { email: "gone@giftpop.test", password: PASSWORD },
    ];
    const responses = [];
    for (const body of attempts) {
      const res = await request(app).post("/v1/auth/login").send(body);
      responses.push({ status: res.status, body: res.body, cookie: res.headers["set-cookie"] });
    }
    expect(new Set(responses.map((r) => r.status))).toEqual(new Set([401]));
    expect(responses[1]?.body).toEqual(responses[0]?.body);
    expect(responses[2]?.body).toEqual(responses[0]?.body);
    expect(responses.every((r) => r.cookie === undefined)).toBe(true);
  });

  it("does comparable password work for an unknown email (no fast path)", async () => {
    await seedStaff({ email: "real@giftpop.test" });
    const time = async (email: string): Promise<number> => {
      const start = performance.now();
      await request(app).post("/v1/auth/login").send({ email, password: "wrong password here" });
      return performance.now() - start;
    };
    await time("warm@giftpop.test"); // warm the dummy hash
    const unknown: number[] = [];
    const known: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      resetLoginRateLimit();
  resetLoginIpRateLimit();
      unknown.push(await time(`nobody${i}@giftpop.test`));
      known.push(await time("real@giftpop.test"));
    }
    const median = (values: number[]) => [...values].sort((a, b) => a - b)[1] ?? 0;
    // A skipped hash would make the unknown email several times faster than argon2 takes.
    expect(median(unknown)).toBeGreaterThan(median(known) * 0.4);
  });

  it("caps password length so a huge password cannot be used to burn CPU", async () => {
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "a@giftpop.test", password: "x".repeat(5_000) });
    expect(res.status).toBe(400);
  });
});

describe("password hashing", () => {
  it("uses argon2id with at least the OWASP minimum cost (19 MiB, t=2)", async () => {
    const hash = await hashPassword("a long enough password");
    // The library writes the parameters as m, p, t; read them by name.
    const [, algorithm, , params] = hash.split("$");
    expect(algorithm).toBe("argon2id");
    const cost = Object.fromEntries(
      (params ?? "").split(",").map((pair) => pair.split("=") as [string, string]),
    );
    expect(Number(cost["m"])).toBeGreaterThanOrEqual(19 * 1024);
    expect(Number(cost["t"])).toBeGreaterThanOrEqual(2);
    expect(Number(cost["p"])).toBeGreaterThanOrEqual(1);
    expect(hash).not.toContain("a long enough password");
  });
});

describe("CSRF: SameSite plus an Origin check on staff routes", () => {
  // Reasoning (also in docs/audit/security.md):
  //  1. The cookie is SameSite=Lax: browsers do not send it on cross-site POST, PUT, PATCH
  //     or DELETE, and no staff GET changes state.
  //  2. express.json only parses application/json, so a cross-site HTML form (urlencoded,
  //     multipart, text/plain) arrives with an empty body and fails validation.
  //  3. A JSON request from another origin needs a CORS preflight, which only the allowlist passes.
  //  4. The store and admin are sibling subdomains (same site, so Lax does not separate them),
  //     so requireStaff also refuses a state-changing request whose Origin is not ADMIN_ORIGIN.
  it("refuses a staff POST from the store origin, even with a valid session", async () => {
    await seedStaff({ email: "a@giftpop.test", role: "owner" });
    const cookie = await loginAs(app, "a@giftpop.test");
    const res = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .set("Origin", "http://localhost:3000") // WEB_ORIGIN: allowed by CORS, not by CSRF
      .send({ email: "x@giftpop.test", name: "X", role: "staff", password: "a long password" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await StaffModel.countDocuments()).toBe(1);
  });

  it("refuses logout-style and status changes from a foreign origin, allows the admin origin", async () => {
    await seedStaff({ email: "a@giftpop.test", role: "owner" });
    const cookie = await loginAs(app, "a@giftpop.test");
    const evil = await request(app)
      .patch(`/v1/admin/orders/${"0".repeat(24)}/notes`)
      .set("Cookie", cookie)
      .set("Origin", "https://evil.example")
      .send({});
    expect(evil.status).toBe(403);

    const ok = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .set("Origin", "http://localhost:3001")
      .send({ email: "x@giftpop.test", name: "X", role: "staff", password: "a long password" });
    expect(ok.status).toBe(201);
  });

  it("allows safe methods from any origin and requests with no Origin header", async () => {
    await seedStaff({ email: "a@giftpop.test", role: "owner" });
    const cookie = await loginAs(app, "a@giftpop.test");
    const read = await request(app)
      .get("/v1/staff")
      .set("Cookie", cookie)
      .set("Origin", "http://localhost:3000");
    expect(read.status).toBe(200);
    const serverToServer = await request(app).get("/v1/auth/me").set("Cookie", cookie);
    expect(serverToServer.status).toBe(200);
  });

  it("assertStaffOrigin compares exact origins", () => {
    const req = (method: string, origin?: string) =>
      ({ method, header: (name: string) => (name === "origin" ? origin : undefined) }) as never;
    const allowed = "https://admin.giftpop.test";
    expect(() => assertStaffOrigin(req("POST", allowed), allowed)).not.toThrow();
    expect(() => assertStaffOrigin(req("POST"), allowed)).not.toThrow();
    expect(() => assertStaffOrigin(req("GET", "https://x.test"), allowed)).not.toThrow();
    for (const origin of [
      "https://admin.giftpop.test.evil.example",
      "http://admin.giftpop.test",
      "https://admin.giftpop.test:8443",
      "null",
    ]) {
      expect(() => assertStaffOrigin(req("DELETE", origin), allowed), origin).toThrow();
    }
  });

  it("does not let a form post reach a staff handler (no body parsed, cookie or not)", async () => {
    await seedStaff({ email: "a@giftpop.test", role: "owner" });
    const cookie = await loginAs(app, "a@giftpop.test");
    const res = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .type("form")
      .send("email=x@giftpop.test&name=X&role=owner&password=a-long-password");
    expect(res.status).toBe(400);
    expect(await StaffModel.countDocuments()).toBe(1);
  });
});
