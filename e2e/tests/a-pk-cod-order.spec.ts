import { expect, test } from "@playwright/test";

import { buildGift } from "../support/builder";
import { checkoutAndPlace } from "../support/checkout";
import { uniqueSuffix } from "../support/env";
import { writeFixture } from "../support/fixture";

// A 1x1 PNG, enough for the proof upload (the API converts it to WebP).
const PROOF_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("a customer in Pakistan builds a gift and orders it with cash on delivery", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const email = `e2e.pk.${suffix}@example.com`;
  const phone = "300 1234567";

  // Home, then the country picker.
  await page.goto("/");
  await page.getByRole("link", { name: "See countries" }).click();
  await page.getByRole("link", { name: /Shop in Pakistan/ }).click();
  await expect(page).toHaveURL(/\/pk$/);
  await page.getByRole("link", { name: "Start building" }).click();
  await expect(page).toHaveURL(/\/pk\/build\/format/);

  // Format, items, arrange, personalise, review.
  await buildGift(page, "Bouquet");
  // The review shows both payment modes side by side, priced in rupees.
  await expect(page.getByText(/PKR/).first()).toBeVisible();

  // Checkout with the Pakistan address format (Province required, postal code optional).
  const number = await checkoutAndPlace(
    page,
    {
      name: "Sara Khan",
      email,
      phone,
      line1: "12 Garden Road",
      city: "Lahore",
      region: { label: /^Province/, value: "Punjab" },
      postalCode: { label: /^Postal code/, value: "54000" },
    },
    "Cash on delivery",
  );
  expect(number).toMatch(/^GP-PK-/);

  // Confirmation.
  await expect(page.getByRole("heading", { name: "Your order", level: 1 })).toBeVisible();
  await expect(page.getByText(number, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Waiting for your payment", { exact: true })).toBeVisible();
  await expect(page.getByText("Amount to pay now")).toBeVisible();
  await expect(page.getByText(/when it is delivered/)).toBeVisible();

  // Hand the order to the staff test before anything else can fail.
  writeFixture({ pkOrder: { number, phone, email } });

  // Upload a payment proof.
  await page.getByLabel("Picture of your receipt").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: PROOF_PNG,
  });
  await page.getByRole("button", { name: "Upload proof" }).click();
  await expect(page.getByText(/We have your proof/)).toBeVisible();
});
