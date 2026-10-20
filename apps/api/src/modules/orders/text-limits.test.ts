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
  orderBody,
  postOrder,
  useFlowDatabase,
} from "../../../test/flows/helpers";

import { resetLimiters, text, TIMEOUT, withPersonalisation, world } from "./text-limits-support";

useFlowDatabase();
const app = buildApp();

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
