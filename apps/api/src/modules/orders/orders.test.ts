import {
  CreateOrderResponseSchema,
  ORDER_NUMBER_ALPHABET,
  OrderNumberSchema,
  type Item,
} from "@giftpop/contracts";
import mongoose, { Types, type ClientSession } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { CountryPriceModel } from "../catalog/model";
import { upsertItem, upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { makeDesign, seedWorld, initCatalogModels, type World } from "../quotes/fixtures";
import { createIpLimiter } from "../quotes/rate-limit";

import { OrderModel } from "./model";
import { createOrdersRouter } from "./router";

const enqueueState = vi.hoisted(() => ({ fail: false, calls: [] as unknown[] }));

// A stand-in outbox that writes in the caller's session, so rollback is observable.
vi.mock("../notifications/service", () => ({
  enqueue: async (input: { orderId: string }, session: ClientSession | undefined) => {
    enqueueState.calls.push({ input, inTransaction: Boolean(session?.inTransaction()) });
    const mongooseModule = await import("mongoose");
    await mongooseModule.default.connection
      .collection("test_outbox")
      .insertOne({ orderId: input.orderId }, { session });
    if (enqueueState.fail) throw new Error("outbox down");
  },
  processOutbox: async () => 0,
}));

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(async () => {
  await clearDatabase();
  enqueueState.fail = false;
  enqueueState.calls = [];
});

// Tests place many orders from one IP; the order limit has its own test below.
const app = createTestApp([
  { path: "/orders", router: createOrdersRouter({ orderLimiter: (_req, _res, next) => next() }) },
]);
let counter = 0;
const nextKey = () => `key-${Date.now()}-${(counter += 1)}-abcdef`;

function body(world: World, extra: Record<string, unknown> = {}, mode = "cod") {
  return {
    country: "PK",
    design: makeDesign(world.packaging, [
      [world.bar, 2],
      [world.soap, 1],
    ]),
    contact: { name: "Sara Khan", email: "sara@example.com", phone: "+92 300 1234567" },
    address: { line1: "12 Garden Road", city: "Lahore", region: "Punjab" },
    paymentMode: mode,
    ...extra,
  };
}

const place = (payload: unknown, key: string | null = nextKey()) => {
  const req = request(app).post("/v1/orders");
  if (key) req.set("Idempotency-Key", key);
  return req.send(payload as object);
};

const stockOf = async (item: Item) =>
  (await CountryPriceModel.findOne({ kind: "item", targetId: new Types.ObjectId(item.id) }).lean())
    ?.stockQty;

describe("POST /v1/orders: creation", () => {
  it("creates an awaiting_payment order with the right number, history and quote", async () => {
    const world = await seedWorld();
    const res = await place(body(world));

    expect(res.status).toBe(201);
    const parsed = CreateOrderResponseSchema.parse(res.body);
    expect(parsed.number).toMatch(new RegExp(`^GP-PK-[${ORDER_NUMBER_ALPHABET}]{6}$`));
    expect(OrderNumberSchema.safeParse(parsed.number).success).toBe(true);
    expect(parsed.paymentInstructions).toBe("Bank: 1234 5678 (DEV ONLY)");

    const order = await OrderModel.findOne({ number: parsed.number }).lean();
    expect(order?.status).toBe("awaiting_payment");
    expect(order?.paymentStatus).toBe("unpaid");
    expect(order?.shipment).toBeNull();
    expect(order?.payments).toEqual([]);
    expect(order?.proofs).toEqual([]);
    expect(order?.history).toHaveLength(1);
    expect(order?.history[0]).toMatchObject({ from: null, to: "awaiting_payment", actorId: null });
    // goods 90_000 + 2 x 45_000 + 12_000 = 192_000, shipping 25_000, cod: 20% of 217_000
    expect(parsed.quote).toMatchObject({
      mode: "cod",
      goodsMinor: 192_000,
      discountMinor: 0,
      totalMinor: 217_000,
      dueNowMinor: 43_400,
      dueOnDeliveryMinor: 173_600,
    });
  });

  it("prices prepaid as 20% off goods only", async () => {
    const world = await seedWorld();
    const res = await place(body(world, {}, "prepaid"));
    expect(res.status).toBe(201);
    expect(res.body.quote).toMatchObject({
      mode: "prepaid",
      discountMinor: 38_400,
      totalMinor: 178_600,
      dueNowMinor: 178_600,
      dueOnDeliveryMinor: 0,
    });
  });

  it("freezes snapshots of every item and the packaging", async () => {
    const world = await seedWorld();
    const res = await place(body(world));
    const order = await OrderModel.findOne({ number: res.body.number }).lean();
    expect(order?.packaging).toMatchObject({
      packagingId: world.packaging.id,
      name: "Box",
      layoutType: "bouquet-fan",
      priceMinor: 90_000,
      minItems: 2,
      maxItems: 4,
      capacityUnits: 8,
    });
    expect(order?.items).toEqual([
      expect.objectContaining({
        itemId: world.bar.id,
        name: "Bar",
        unitPriceMinor: 45_000,
        qty: 2,
      }),
      expect.objectContaining({
        itemId: world.soap.id,
        name: "Soap",
        unitPriceMinor: 12_000,
        qty: 1,
      }),
    ]);
  });

  it("ignores every price the client sends", async () => {
    const world = await seedWorld();
    const design = makeDesign(world.packaging, [
      [world.bar, 2],
      [world.soap, 1],
    ]);
    const tampered = {
      ...body(world),
      totalMinor: 1,
      priceMinor: 1,
      unitPriceMinor: 1,
      quote: { totalMinor: 1, dueNowMinor: 1, goodsMinor: 1 },
      design: {
        ...design,
        priceMinor: 1,
        items: design.items.map((line) => ({ ...line, unitPriceMinor: 1, priceMinor: 1 })),
      },
    };
    const res = await place(tampered);
    expect(res.status).toBe(201);
    expect(res.body.quote.totalMinor).toBe(217_000);
    const order = await OrderModel.findOne({ number: res.body.number }).lean();
    expect(order?.quote.totalMinor).toBe(217_000);
    expect(order?.items.map((i) => i.unitPriceMinor)).toEqual([45_000, 12_000]);
    expect(order?.packaging.priceMinor).toBe(90_000);
    expect(JSON.stringify(order?.design)).not.toContain("unitPriceMinor");
  });

  it("keeps the order unchanged after a catalog price edit and after the item is deactivated", async () => {
    const world = await seedWorld();
    const res = await place(body(world));
    await upsertPrices([
      { kind: "item", itemId: world.bar.id, country: "PK", priceMinor: 99_999, inStock: true },
    ]);
    await upsertItem({ ...world.bar, name: "Renamed", active: false });

    const order = await OrderModel.findOne({ number: res.body.number }).lean();
    expect(order?.items[0]).toMatchObject({ name: "Bar", unitPriceMinor: 45_000 });
    expect(order?.quote.totalMinor).toBe(217_000);
  });

  it("decrements counted stock and enqueues order_created inside the transaction", async () => {
    const world = await seedWorld();
    await upsertPrices([
      {
        kind: "item",
        itemId: world.bar.id,
        country: "PK",
        priceMinor: 45_000,
        inStock: true,
        stockQty: 5,
      },
    ]);
    const res = await place(body(world));
    expect(res.status).toBe(201);
    expect(await stockOf(world.bar)).toBe(3);

    const order = await OrderModel.findOne({ number: res.body.number }).lean();
    expect(enqueueState.calls).toEqual([
      expect.objectContaining({
        inTransaction: true,
        input: expect.objectContaining({
          type: "order_created",
          orderId: order?._id.toHexString(),
          payload: expect.objectContaining({ number: res.body.number, country: "PK" }),
        }),
      }),
    ]);
  });
});

describe("POST /v1/orders: rollback and stock", () => {
  it("a failure after reserving stock leaves no order, no stock change and no outbox entry", async () => {
    const world = await seedWorld();
    await upsertPrices([
      {
        kind: "item",
        itemId: world.bar.id,
        country: "PK",
        priceMinor: 45_000,
        inStock: true,
        stockQty: 5,
      },
    ]);
    enqueueState.fail = true;

    const res = await place(body(world));
    expect(res.status).toBe(500);
    expect(await OrderModel.countDocuments()).toBe(0);
    expect(await stockOf(world.bar)).toBe(5);
    expect(await mongoose.connection.collection("test_outbox").countDocuments()).toBe(0);
  });

  it("lets exactly one of two simultaneous orders take the last unit", async () => {
    const world = await seedWorld();
    await upsertPrices([
      {
        kind: "item",
        itemId: world.bar.id,
        country: "PK",
        priceMinor: 45_000,
        inStock: true,
        stockQty: 1,
      },
    ]);
    const single = body(world, {
      design: makeDesign(world.packaging, [
        [world.bar, 1],
        [world.soap, 1],
      ]),
    });

    const [a, b] = await Promise.all([place(single), place(single)]);
    // The loser is refused either at the stock update (409) or, when the winner has already
    // committed by the time it validates, as an out-of-stock design (422). Both leave nothing behind.
    const statuses = [a.status, b.status].sort();
    expect(statuses[0], JSON.stringify([a.body, b.body])).toBe(201);
    expect([409, 422]).toContain(statuses[1]);
    expect(await stockOf(world.bar)).toBe(0);
    expect(await OrderModel.countDocuments()).toBe(1);
  });
});

describe("POST /v1/orders: rules", () => {
  it("rejects a payment mode the country does not take", async () => {
    const world = await seedWorld({ country: { paymentModes: ["prepaid"] } });
    const res = await place(body(world, {}, "cod"));
    expect(res.status).toBe(422);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("follows the country's address format: required region is enforced, optional is not", async () => {
    const world = await seedWorld();
    const missing = await place(body(world, { address: { line1: "1 Road", city: "Lahore" } }));
    expect(missing.status).toBe(422);
    expect(missing.body.error.code).toBe("VALIDATION_ERROR");
    expect(missing.body.error.details).toEqual([
      { field: "region", message: "Province is required" },
    ]);

    await clearDatabase();
    const open = await seedWorld({
      country: {
        addressFormat: {
          region: { required: false, label: "State" },
          postalCode: { required: false, label: "ZIP" },
        },
      },
    });
    const ok = await place(body(open, { address: { line1: "1 Road", city: "Lahore" } }));
    expect(ok.status).toBe(201);
  });

  it("answers 422 for a coming-soon country and 404 for an unknown one", async () => {
    const world = await seedWorld({ country: makeCountry({ status: "coming_soon" }) });
    expect((await place(body(world))).status).toBe(422);
    expect((await place(body(world, { country: "ZZ" }))).status).toBe(404);
  });

  it("answers 422 DESIGN_INVALID with problems for a design that cannot be made", async () => {
    const world = await seedWorld();
    const res = await place(body(world, { design: makeDesign(world.packaging, [[world.bar, 1]]) }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("DESIGN_INVALID");
    expect(res.body.error.details.problems.length).toBeGreaterThan(0);
  });

  it("answers 400 for a malformed body", async () => {
    const world = await seedWorld();
    const res = await place({ ...body(world), contact: { name: "", email: "nope", phone: "x" } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /v1/orders: idempotency", () => {
  it("requires a well-formed Idempotency-Key", async () => {
    const world = await seedWorld();
    expect((await place(body(world), null)).status).toBe(400);
    expect((await place(body(world), "short")).status).toBe(400);
    expect((await place(body(world), "has spaces in it!")).status).toBe(400);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it("replays the first response for the same key and body, creating one order", async () => {
    const world = await seedWorld();
    const key = nextKey();
    const first = await place(body(world), key);
    const second = await place(body(world), key);
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(await OrderModel.countDocuments()).toBe(1);
  });

  it("answers 409 for the same key with a different body", async () => {
    const world = await seedWorld();
    const key = nextKey();
    await place(body(world), key);
    const res = await place(body(world, {}, "prepaid"), key);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(await OrderModel.countDocuments()).toBe(1);
  });

  it("creates one order when two requests with the same key arrive together", async () => {
    const world = await seedWorld();
    const key = nextKey();
    const results = await Promise.all([place(body(world), key), place(body(world), key)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses[0]).toBe(201);
    expect([201, 409]).toContain(statuses[1]);
    expect(await OrderModel.countDocuments()).toBe(1);
  });

  it("does not cache a failed first attempt", async () => {
    const world = await seedWorld();
    const key = nextKey();
    enqueueState.fail = true;
    expect((await place(body(world), key)).status).toBe(500);
    enqueueState.fail = false;
    expect((await place(body(world), key)).status).toBe(201);
    expect(await OrderModel.countDocuments()).toBe(1);
  });
});

describe("POST /v1/orders: rate limit", () => {
  it("answers 429 once one IP has placed too many orders, even for invalid requests", async () => {
    const limited = createTestApp([
      {
        path: "/orders",
        router: createOrdersRouter({ orderLimiter: createIpLimiter({ limit: 3 }) }),
      },
    ]);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await request(limited)
        .post("/v1/orders")
        .set("Idempotency-Key", nextKey())
        .send({ nothing: "valid" });
      statuses.push(res.status);
    }
    expect(statuses).toEqual([400, 400, 400, 429, 429]);
  });
});
