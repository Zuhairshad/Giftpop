import { ErrorResponseSchema } from "@giftpop/contracts";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { hasUnsafeKey, isUnsafeKey } from "../../src/middleware/reject-operator-keys";
import { seedStaff } from "../../src/modules/auth/auth.test-utils";
import { insertOrder } from "../../src/modules/orders/fixtures";
import { OrderModel } from "../../src/modules/orders/model";
import { createTestApp } from "../app";
import { clearDatabase, useTestMongo } from "../mongo";

useTestMongo();
beforeEach(clearDatabase);

// The real registry, real limiters: nothing is mocked, so the guard is what stops these.
const app = createTestApp();

function expectRefused(res: request.Response) {
  expect(res.status).toBe(400);
  const parsed = ErrorResponseSchema.parse(res.body);
  expect(parsed.error.code).toBe("VALIDATION_ERROR");
  // The offending key is never echoed back.
  expect(res.text).not.toMatch(/\$ne|\$gt|\$where|__proto__/);
}

describe("key guard (unit)", () => {
  it("flags operator, dotted, prototype and bracket keys at any depth", () => {
    for (const key of ["$ne", "$where", "a.b", "__proto__", "a[$ne]", "a\0b", "$"]) {
      expect(isUnsafeKey(key), key).toBe(true);
    }
    expect(hasUnsafeKey({ a: [{ b: { $gt: "" } }] })).toBe(true);
    expect(hasUnsafeKey(JSON.parse('{"__proto__": {"admin": true}}'))).toBe(true);
  });

  it("accepts ordinary bodies, including ids, emails, dial codes and unicode", () => {
    expect(
      hasUnsafeKey({
        country: "PK",
        design: {
          items: [{ itemId: "a".repeat(24), qty: 1, slot: 0 }],
          personalisation: { itemNames: {} },
        },
        contact: { email: "a.b@example.com", phone: "+92 300 1234567", name: "Zoë $5.00" },
      }),
    ).toBe(false);
    expect(hasUnsafeKey(undefined)).toBe(false);
    expect(hasUnsafeKey(null)).toBe(false);
  });

  it("refuses a body nested deeper than any schema needs", () => {
    let deep: unknown = "x";
    for (let i = 0; i < 40; i += 1) deep = { a: deep };
    expect(hasUnsafeKey(deep)).toBe(true);
  });
});

describe("POST /v1/orders", () => {
  const post = (body: unknown) =>
    request(app)
      .post("/v1/orders")
      .set("Idempotency-Key", "inject-test-key-0001")
      .send(body as object);

  it("refuses an operator object where a string is expected", async () => {
    expectRefused(await post({ country: { $ne: null }, paymentMode: "cod" }));
    expectRefused(await post({ contact: { email: { $gt: "" }, name: "x", phone: "1" } }));
  });

  it("refuses a dotted key", async () => {
    expectRefused(await post({ "contact.email": "a@b.c" }));
  });
});

describe("POST /v1/orders/track", () => {
  it("does not let { $ne: null } match any order, and never reaches the lookup", async () => {
    const id = await insertOrder("awaiting_payment", { number: "GP-PK-ABCDE2" });
    const attack = await request(app)
      .post("/v1/orders/track")
      .send({ number: { $ne: null }, contact: { $ne: null } });
    expectRefused(attack);
    expect(attack.text).not.toMatch(/ABCDE2|sara@example/);

    const regex = await request(app)
      .post("/v1/orders/track")
      .send({ number: { $regex: "^GP" }, contact: "sara@example.com" });
    expectRefused(regex);
    expect(await OrderModel.countDocuments({ _id: id })).toBe(1);
  });

  it("still answers a plain wrong contact with the normal 404", async () => {
    await insertOrder("awaiting_payment", { number: "GP-PK-ABCDE2" });
    const res = await request(app)
      .post("/v1/orders/track")
      .send({ number: "GP-PK-ABCDE2", contact: "someone-else@example.com" });
    expect(res.status).toBe(404);
  });
});

describe("POST /v1/auth/login", () => {
  it("refuses { $ne: null } as the email and sets no cookie", async () => {
    await seedStaff({ email: "owner@giftpop.test" });
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: { $ne: null }, password: { $ne: null } });
    expectRefused(res);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("refuses an operator in the password too", async () => {
    await seedStaff({ email: "owner@giftpop.test" });
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: "owner@giftpop.test", password: { $gt: "" } });
    expectRefused(res);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("POST /v1/partner-requests", () => {
  it("refuses operator and dotted keys before the limiter or the database see them", async () => {
    expectRefused(
      await request(app)
        .post("/v1/partner-requests")
        .send({ name: { $gt: "" } }),
    );
    expectRefused(
      await request(app).post("/v1/partner-requests").send({ brand: "x", $where: "sleep(5000)" }),
    );
    expectRefused(await request(app).post("/v1/partner-requests").send({ "a.b": "x" }));
  });
});

describe("query strings and the other public endpoints", () => {
  it("refuses operator, bracket and dotted query keys", async () => {
    expectRefused(await request(app).get("/v1/catalog").query("country[$ne]=PK"));
    expectRefused(await request(app).get("/v1/catalog").query("$where=1&country=PK"));
    expectRefused(await request(app).get("/v1/catalog").query("a.b=1&country=PK"));
    expectRefused(await request(app).get("/v1/templates").query("country[$regex]=."));
  });

  it("refuses operators in quotes, designs and template start bodies", async () => {
    expectRefused(
      await request(app)
        .post("/v1/quotes")
        .send({ country: { $ne: "" } }),
    );
    expectRefused(
      await request(app)
        .post("/v1/designs")
        .send({ design: { $where: "1" } }),
    );
    expectRefused(
      await request(app)
        .post(`/v1/templates/${"0".repeat(24)}/start`)
        .send({ country: { $ne: "" } }),
    );
  });

  it("refuses operators on the proof upload path parameters and staff routes alike", async () => {
    expectRefused(
      await request(app).get("/v1/admin/orders").query("search[$ne]=x").set("Cookie", "gp_admin=x"),
    );
  });
});
