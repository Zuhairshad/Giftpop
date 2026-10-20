// Pins the length caps of the contact, address, track and body-size limits on the public routes.
// Each field has a happy path at exactly the limit and a rejection one character over.
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  buildApp,
  makeDesign,
  orderBody,
  postOrder,
  useFlowDatabase,
  SARA,
  PK_ADDRESS,
} from "../../../test/flows/helpers";

import { resetLimiters, text, TIMEOUT, world } from "./text-limits-support";

useFlowDatabase();
const app = buildApp();

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
