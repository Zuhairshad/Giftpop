import { Types } from "mongoose";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { insertOrder } from "../orders/fixtures";
import { OrderModel, type OrderDoc } from "../orders/model";

import { api, createAdminApp, signIn, type StaffSession } from "./admin-orders.test-utils";

useTestMongo();
beforeAll(async () => {
  await OrderModel.init();
});

const app = createAdminApp();
let session: StaffSession;
beforeEach(async () => {
  await clearDatabase();
  session = await signIn(app);
});

const list = (query = "") => api(app, session).get(`/${query ? `?${query}` : ""}`);
const numbers = (body: { items: { number: string }[] }) => body.items.map((i) => i.number);

/** Inserts with an exact createdAt (timestamps allow an explicit value on create). */
async function insertAt(createdAt: string, overrides: Partial<OrderDoc> = {}) {
  return insertOrder(overrides.status ?? "awaiting_payment", {
    createdAt: new Date(createdAt),
    ...overrides,
  });
}

describe("GET / filters", () => {
  it("combines status, country, dates, pending proof and search with AND", async () => {
    const pending = {
      _id: new Types.ObjectId(),
      url: "u",
      status: "pending",
      uploadedAt: new Date(),
    };
    const accepted = { ...pending, _id: new Types.ObjectId(), status: "accepted" };
    await insertAt("2026-10-10T12:00:00Z", {
      number: "GP-PK-AAAAAA",
      status: "confirmed",
      proofs: [pending],
      contact: { name: "Sara", email: "Sara@Example.com", phone: "+92 300 1234567" },
    } as Partial<OrderDoc>);
    await insertAt("2026-10-10T12:00:00Z", { number: "GP-PK-BBBBBB", status: "confirmed" });
    await insertAt("2026-10-10T12:00:00Z", {
      number: "GP-AE-CCCCCC",
      country: "AE",
      status: "confirmed",
      proofs: [pending],
    } as Partial<OrderDoc>);
    await insertAt("2026-10-12T12:00:00Z", {
      number: "GP-PK-DDDDDD",
      status: "confirmed",
      proofs: [pending],
    } as Partial<OrderDoc>);
    await insertAt("2026-10-10T12:00:00Z", {
      number: "GP-PK-EEEEEE",
      proofs: [pending],
    } as Partial<OrderDoc>);
    await insertAt("2026-10-10T12:00:00Z", {
      number: "GP-PK-FFFFFF",
      status: "confirmed",
      proofs: [accepted],
    } as Partial<OrderDoc>);

    const base = "status=confirmed&country=pk&from=2026-10-10&to=2026-10-10&hasPendingProof=true";
    expect(numbers((await list(base)).body)).toEqual(["GP-PK-AAAAAA"]);
    expect(numbers((await list(`${base}&search=gp-pk-aaaaaa`)).body)).toEqual(["GP-PK-AAAAAA"]);
    expect(numbers((await list(`${base}&search=gp-pk-bbbbbb`)).body)).toEqual([]);
    expect(numbers((await list(`${base}&search=sara@example.com`)).body)).toEqual(["GP-PK-AAAAAA"]);
    expect(numbers((await list(`${base}&search=(92)300-123 4567`)).body)).toEqual(["GP-PK-AAAAAA"]);
    expect(numbers((await list(`${base}&search=923001234568`)).body)).toEqual([]);
  });

  it("treats from and to as whole UTC days and filters on proofs being absent", async () => {
    await insertAt("2026-10-09T23:59:59Z", { number: "GP-PK-111111" });
    await insertAt("2026-10-10T00:00:00Z", { number: "GP-PK-222222" });
    await insertAt("2026-10-10T23:59:59Z", { number: "GP-PK-333333" });
    await insertAt("2026-10-11T00:00:00Z", { number: "GP-PK-444444" });
    const res = await list("from=2026-10-10&to=2026-10-10");
    expect(numbers(res.body)).toEqual(["GP-PK-333333", "GP-PK-222222"]);
    expect((await list("hasPendingProof=false")).body.items).toHaveLength(4);
  });

  it("filters by payment status and returns the list item shape", async () => {
    await insertAt("2026-10-10T00:00:00Z", { paymentStatus: "paid" });
    await insertAt("2026-10-10T00:00:00Z");
    const res = await list("paymentStatus=paid");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      customerName: "Sara Khan",
      currency: "PKR",
      totalMinor: 205_000,
      paymentMode: "cod",
      paymentStatus: "paid",
      itemCount: 2,
      hasPendingProof: false,
    });
    expect(res.body.nextCursor).toBeNull();
  });

  it("answers 400 for bad filters", async () => {
    for (const q of ["status=bogus", "limit=0", "limit=101", "from=yesterday", "from=2026-02-31"]) {
      expect((await list(q)).status, q).toBe(400);
    }
  });
});

describe("GET / cursor pagination", () => {
  it("walks every order exactly once, even when createdAt ties", async () => {
    const same = "2026-10-10T12:00:00Z";
    const ids: string[] = [];
    for (let i = 0; i < 7; i++) ids.push(await insertAt(same));
    for (let i = 0; i < 3; i++) ids.push(await insertAt(`2026-10-0${i + 1}T00:00:00Z`));

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res = await list(`limit=3${cursor ? `&cursor=${cursor}` : ""}`);
      expect(res.status).toBe(200);
      seen.push(...res.body.items.map((i: { id: string }) => i.id));
      cursor = res.body.nextCursor;
      pages++;
    } while (cursor);

    expect(pages).toBe(4);
    expect(new Set(seen).size).toBe(10);
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it("returns a null cursor when the page is exactly full and nothing follows", async () => {
    await insertAt("2026-10-10T00:00:00Z");
    await insertAt("2026-10-11T00:00:00Z");
    const res = await list("limit=2");
    expect(res.body.items).toHaveLength(2);
    expect(res.body.nextCursor).toBeNull();
  });

  it("rejects a tampered cursor with 400", async () => {
    await insertAt("2026-10-10T00:00:00Z");
    const forged = Buffer.from(JSON.stringify({ at: "x", id: "nope" })).toString("base64url");
    for (const cursor of ["garbage", forged, Buffer.from("[1]").toString("base64url")]) {
      const res = await list(`cursor=${cursor}`);
      expect(res.status, cursor).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
