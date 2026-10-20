// The browser blocks these inputs; the API must reject them too (a browser is not a boundary).
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

import { resetLimiters, TIMEOUT, withPersonalisation, world } from "./text-limits-support";

useFlowDatabase();
const app = buildApp();

async function setup() {
  const w = await world();
  const design = makeDesign(w.packaging, [
    [w.bar, 1],
    [w.nameable, 1],
  ]);
  return { ...w, design: withPersonalisation(design, { itemNames: { [w.nameable.id]: "Sara" } }) };
}

describe("personalisation is required to place an order", () => {
  it(
    "accepts a filled design",
    async () => {
      const { design } = await setup();
      resetLimiters();
      const res = await postOrder(app, orderBody(design));
      expect(res.status, JSON.stringify(res.body)).toBe(201);
    },
    TIMEOUT,
  );

  it.each([
    ["an empty recipient", { recipientName: "" }, "recipientName"],
    ["a blank recipient", { recipientName: "   " }, "recipientName"],
    ["an empty card message", { cardMessage: "" }, "cardMessage"],
    ["digits in the recipient", { recipientName: "R2D2" }, "recipientName"],
  ])(
    "rejects %s with 422 DESIGN_INVALID",
    async (_label, patch, field) => {
      const { design } = await setup();
      resetLimiters();
      const res = await postOrder(app, orderBody(withPersonalisation(design, patch)));
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("DESIGN_INVALID");
      expect(res.body.error.details.problems.map((p: { field: string }) => p.field)).toContain(
        field,
      );
    },
    TIMEOUT,
  );

  it(
    "rejects a missing or digit-filled name on a personalizable item",
    async () => {
      const { design, nameable } = await setup();
      for (const itemNames of [{}, { [nameable.id]: " " }, { [nameable.id]: "Sara 1" }]) {
        resetLimiters();
        const res = await postOrder(app, orderBody(withPersonalisation(design, { itemNames })));
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("DESIGN_INVALID");
      }
    },
    TIMEOUT,
  );

  it(
    "still quotes and saves an unfinished design (drafts and share links)",
    async () => {
      const { design } = await setup();
      const draft = withPersonalisation(design, {
        recipientName: "",
        cardMessage: "",
        itemNames: {},
      });
      resetLimiters();
      const quote = await request(app).post("/v1/quotes").send({ country: "PK", design: draft });
      expect(quote.status, JSON.stringify(quote.body)).toBe(200);
      const save = await request(app).post("/v1/designs").send({ country: "PK", design: draft });
      expect(save.status, JSON.stringify(save.body)).toBe(201);
    },
    TIMEOUT,
  );
});

describe("contact and address characters", () => {
  it.each([
    ["contact", "name", "Sara 123"],
    ["contact", "phone", "abc 123456"],
    ["contact", "phone", "+92 (300) 123-4567"],
    ["address", "city", "L4hore"],
    ["address", "region", "Punjab 99"],
    ["address", "postalCode", "54<>"],
    ["address", "line1", "12 <b>"],
    ["address", "line2", "Flat $5"],
  ])(
    "rejects %s.%s = %s with 400",
    async (group, field, value) => {
      const { design } = await setup();
      const body = orderBody(design);
      if (group === "contact") body["contact"] = { ...SARA, [field]: value };
      else body["address"] = { ...PK_ADDRESS, [field]: value };
      resetLimiters();
      const res = await postOrder(app, body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    },
    TIMEOUT,
  );

  it(
    "accepts letters from any script, a hyphenated postcode and an address with # and /",
    async () => {
      const { design } = await setup();
      resetLimiters();
      const res = await postOrder(
        app,
        orderBody(design, {
          contact: { ...SARA, name: "Zoë O'Neil-Smith" },
          address: {
            line1: "12/B, Main St. #4",
            city: "Köln",
            region: "Punjab",
            postalCode: "SW1A 1AA",
          },
        }),
      );
      expect(res.status, JSON.stringify(res.body)).toBe(201);
    },
    TIMEOUT,
  );
});
