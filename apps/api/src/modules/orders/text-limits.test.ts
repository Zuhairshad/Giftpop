// Pins the length caps of every public text field on the order, quote, design and track routes.
// Each field has a happy path at exactly the limit and a rejection one character over.
// These tests describe today's behaviour so a regression is caught; they do not set product rules.
import {
  CARD_MESSAGE_MAX_LENGTH,
  CUSTOM_REQUEST_MAX_LENGTH,
  ITEM_NAME_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
  type Design,
} from "@giftpop/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  buildApp,
  makeDesign,
  makeItem,
  orderBody,
  postOrder,
  seedWorld,
  useFlowDatabase,
  SARA,
  PK_ADDRESS,
  type World,
} from "../../../test/flows/helpers";
import { upsertItem, upsertPrices } from "../catalog/service";
import { resetSaveRateLimit } from "../designs/rate-limit";
import { resetQuoteRateLimit } from "../quotes/rate-limit";

import { resetOrderRateLimit, resetTrackRateLimit } from "./rate-limit";

// Hashing-free but Mongo-backed: give a busy full run room.
const TIMEOUT = 30_000;

useFlowDatabase();
const app = buildApp();

function resetLimiters(): void {
  resetOrderRateLimit();
  resetQuoteRateLimit();
  resetSaveRateLimit();
  resetTrackRateLimit();
}

const text = (length: number): string => "a".repeat(length);

async function world(): Promise<World & { nameable: World["bar"] }> {
  const w = await seedWorld();
  const nameable = await upsertItem(
    makeItem({
      name: "Mug",
      sizeUnits: 1,
      personalizable: true,
      personalizationMaxLength: 10,
    }),
  );
  await upsertPrices([
    { kind: "item", itemId: nameable.id, country: "PK", priceMinor: 30_000, inStock: true },
  ]);
  return { ...w, nameable };
}

function withPersonalisation(design: Design, patch: Partial<Design["personalisation"]>): Design {
  return { ...design, personalisation: { ...design.personalisation, ...patch } };
}

describe("design text caps (order, quote, save)", () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    ["recipientName", RECIPIENT_NAME_MAX_LENGTH],
    ["cardMessage", CARD_MESSAGE_MAX_LENGTH],
    ["customRequest", CUSTOM_REQUEST_MAX_LENGTH],
  ];

  it.each(cases)(
    "%s: accepts exactly %i characters and rejects one more",
    async (field, limit) => {
      const { packaging, bar, soap } = await world();
      const base = makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]);
      const ok = withPersonalisation(base, { [field]: text(limit) });
      const tooLong = withPersonalisation(base, { [field]: text(limit + 1) });

      for (const [route, body] of [
        ["/v1/quotes", (d: Design) => ({ country: "PK", design: d })],
        ["/v1/designs", (d: Design) => ({ country: "PK", design: d })],
      ] as const) {
        resetLimiters();
        const good = await request(app).post(route).send(body(ok));
        expect(
          good.status,
          `${route} ${field} at limit: ${JSON.stringify(good.body)}`,
        ).toBeLessThan(300);
        resetLimiters();
        const bad = await request(app).post(route).send(body(tooLong));
        expect(bad.status, `${route} ${field} over limit`).toBe(400);
        expect(bad.body.error.code).toBe("VALIDATION_ERROR");
      }

      resetLimiters();
      const placed = await postOrder(app, orderBody(ok));
      expect(placed.status, JSON.stringify(placed.body)).toBe(201);
      resetLimiters();
      const rejected = await postOrder(app, orderBody(tooLong));
      expect(rejected.status).toBe(400);
    },
    TIMEOUT,
  );

  it(
    "itemNames: a name over the hard ceiling is a 400",
    async () => {
      const { packaging, bar, nameable } = await world();
      const base = makeDesign(packaging, [
        [bar, 1],
        [nameable, 1],
      ]);
      resetLimiters();
      const tooLong = withPersonalisation(base, {
        itemNames: { [nameable.id]: text(ITEM_NAME_MAX_LENGTH + 1) },
      });
      const res = await request(app).post("/v1/quotes").send({ country: "PK", design: tooLong });
      expect(res.status).toBe(400);
    },
    TIMEOUT,
  );

  it(
    "itemNames: the item's own limit (10) is enforced with 422 TEXT_TOO_LONG",
    async () => {
      const { packaging, bar, nameable } = await world();
      const base = makeDesign(packaging, [
        [bar, 1],
        [nameable, 1],
      ]);

      resetLimiters();
      const ok = withPersonalisation(base, { itemNames: { [nameable.id]: text(10) } });
      expect((await postOrder(app, orderBody(ok))).status).toBe(201);

      resetLimiters();
      const over = withPersonalisation(base, { itemNames: { [nameable.id]: text(11) } });
      const res = await postOrder(app, orderBody(over));
      expect(res.status, JSON.stringify(res.body)).toBe(422);
      expect(res.body.error.code).toBe("DESIGN_INVALID");
      expect(res.body.error.details.problems).toContainEqual(
        expect.objectContaining({ code: "TEXT_TOO_LONG", itemId: nameable.id, field: "itemNames" }),
      );
    },
    TIMEOUT,
  );

  it(
    "itemNames: naming an item that cannot be personalised is 422 TEXT_TOO_LONG",
    async () => {
      const { packaging, bar, soap } = await world();
      const base = makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]);
      resetLimiters();
      const res = await postOrder(
        app,
        orderBody(withPersonalisation(base, { itemNames: { [bar.id]: "Sara" } })),
      );
      expect(res.status).toBe(422);
      expect(res.body.error.details.problems).toContainEqual(
        expect.objectContaining({ code: "TEXT_TOO_LONG", itemId: bar.id }),
      );
    },
    TIMEOUT,
  );
});

describe("contact and address caps (order)", () => {
  const fields: ReadonlyArray<{
    name: string;
    limit: number;
    apply: (value: string) => Record<string, unknown>;
  }> = [
    { name: "contact.name", limit: 80, apply: (v) => ({ contact: { ...SARA, name: v } }) },
    {
      name: "contact.email",
      limit: 200,
      apply: (v) => ({ contact: { ...SARA, email: `${v}@example.com` } }),
    },
    {
      name: "contact.phone",
      limit: 20,
      apply: (v) => ({ contact: { ...SARA, phone: v } }),
    },
    { name: "address.line1", limit: 120, apply: (v) => ({ address: { ...PK_ADDRESS, line1: v } }) },
    { name: "address.line2", limit: 120, apply: (v) => ({ address: { ...PK_ADDRESS, line2: v } }) },
    { name: "address.city", limit: 80, apply: (v) => ({ address: { ...PK_ADDRESS, city: v } }) },
    {
      name: "address.region",
      limit: 80,
      apply: (v) => ({ address: { ...PK_ADDRESS, region: v } }),
    },
    {
      name: "address.postalCode",
      limit: 20,
      apply: (v) => ({ address: { ...PK_ADDRESS, postalCode: v } }),
    },
  ];

  it.each(fields)(
    "$name: accepts $limit characters and rejects one more",
    async ({ name, limit, apply }) => {
      const { packaging, bar, soap } = await world();
      const design = makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]);
      // The email limit counts the whole address, so its local part is shorter by the domain.
      const fill = (n: number): string =>
        name === "contact.email"
          ? text(n - "@example.com".length)
          : name === "contact.phone"
            ? "1".repeat(n)
            : text(n);

      resetLimiters();
      const ok = await postOrder(app, { ...orderBody(design), ...apply(fill(limit)) });
      expect(ok.status, `${name} at limit: ${JSON.stringify(ok.body)}`).toBe(201);

      resetLimiters();
      const over = await postOrder(app, { ...orderBody(design), ...apply(fill(limit + 1)) });
      expect(over.status, `${name} over limit`).toBe(400);
      expect(over.body.error.code).toBe("VALIDATION_ERROR");
    },
    TIMEOUT,
  );
});

describe("track contact cap", () => {
  it(
    "accepts 200 characters and rejects 201",
    async () => {
      resetLimiters();
      const ok = await request(app)
        .post("/v1/orders/track")
        .send({ number: "GP-PK-ABC123", contact: text(200) });
      expect(ok.status).toBe(404);
      resetLimiters();
      const over = await request(app)
        .post("/v1/orders/track")
        .send({ number: "GP-PK-ABC123", contact: text(201) });
      expect(over.status).toBe(400);
    },
    TIMEOUT,
  );
});

describe("request body size", () => {
  it(
    "rejects a body over 100kb before any field is read",
    async () => {
      resetLimiters();
      const res = await request(app)
        .post("/v1/quotes")
        .send({ country: "PK", filler: text(120_000) });
      expect(res.status).toBe(413);
    },
    TIMEOUT,
  );
});
