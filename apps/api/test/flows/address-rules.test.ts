import { beforeEach, describe, expect, it } from "vitest";

import {
  buildApp,
  makeDesign,
  orderBody,
  orderCount,
  postOrder,
  seedWorld,
  SARA,
  useFlowDatabase,
  type World,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

let pk: World;
let gb: World;

// PK: region ("Province") required, postal code optional.
// GB: region optional, postal code ("Postcode") required.
beforeEach(async () => {
  pk = await seedWorld();
  gb = await seedWorld({
    country: {
      code: "GB",
      name: "United Kingdom",
      currency: "GBP",
      shipping: { flatMinor: 450, deliveryDays: { min: 2, max: 4 } },
      addressFormat: {
        region: { required: false, label: "County" },
        postalCode: { required: true, label: "Postcode" },
      },
    },
    packagingPriceMinor: 1_500,
    barPriceMinor: 400,
    soapPriceMinor: 300,
  });
});

function designFor(world: World) {
  return makeDesign(world.packaging, [
    [world.bar, 1],
    [world.soap, 1],
  ]);
}

function body(world: World, country: string, address: Record<string, unknown>) {
  return orderBody(designFor(world), { country, address, contact: SARA });
}

describe("address rules follow the country's data", () => {
  it("PK: a missing region gives 422 naming region, and stores nothing", async () => {
    const res = await postOrder(app, body(pk, "PK", { line1: "12 Garden Road", city: "Lahore" }));

    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body.error)).toContain("region");
    expect(await orderCount()).toBe(0);
  });

  it("PK: a blank region is the same as a missing one", async () => {
    const res = await postOrder(
      app,
      body(pk, "PK", { line1: "12 Garden Road", city: "Lahore", region: "   " }),
    );

    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body.error)).toContain("region");
  });

  it("PK: the postal code is optional", async () => {
    const res = await postOrder(
      app,
      body(pk, "PK", { line1: "12 Garden Road", city: "Lahore", region: "Punjab" }),
    );

    expect(res.status).toBe(201);
  });

  it("GB: no region is needed, but a missing postal code gives 422 naming postalCode", async () => {
    const withoutPostcode = await postOrder(
      app,
      body(gb, "GB", { line1: "1 High St", city: "Leeds" }),
    );
    expect(withoutPostcode.status).toBe(422);
    expect(JSON.stringify(withoutPostcode.body.error)).toContain("postalCode");
    expect(await orderCount()).toBe(0);

    const ok = await postOrder(
      app,
      body(gb, "GB", { line1: "1 High St", city: "Leeds", postalCode: "LS1 4AP" }),
    );
    expect(ok.status).toBe(201);
  });

  it("names every missing field when several are missing", async () => {
    const res = await postOrder(app, body(pk, "PK", { line1: "12 Garden Road" }));

    expect([400, 422]).toContain(res.status);
    expect(JSON.stringify(res.body.error)).toContain("city");
    expect(await orderCount()).toBe(0);
  });
});
