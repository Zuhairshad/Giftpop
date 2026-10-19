import { expect, test } from "@playwright/test";

import { checkoutAndPlace } from "../support/checkout";
import { uniqueSuffix } from "../support/env";
import { FEATURED_TEMPLATE_TITLE } from "../support/featured-template";
import { writeFixture } from "../support/fixture";

test("a customer in the US starts from a featured template and pays now", async ({ page }) => {
  const suffix = uniqueSuffix();

  // The builder's first question lists the featured template; "Start from this" opens it pre-filled.
  await page.goto("/us/build");
  await expect(page.getByRole("heading", { name: FEATURED_TEMPLATE_TITLE })).toBeVisible();
  await page.getByRole("link", { name: `Start from this: ${FEATURED_TEMPLATE_TITLE}` }).click();

  // Review question, loaded from the template: the gift, the card message, both prices.
  await expect(page.getByRole("heading", { name: "Your gift is ready", level: 2 })).toBeVisible();
  await expect(page.getByText(/Pay now/i).first()).toBeVisible();
  await expect(page.getByText(/\$\d/).first()).toBeVisible();
  await expect(page.getByText(/Thinking of you/).first()).toBeVisible();

  // Checkout with the US address format (State and ZIP are both required).
  const number = await checkoutAndPlace(
    page,
    {
      name: "Jordan Lee",
      email: `e2e.us.${suffix}@example.com`,
      phone: "512 555 0100",
      line1: "500 Congress Ave",
      city: "Austin",
      region: { label: /^State/, value: "Texas" },
      postalCode: { label: /^ZIP/, value: "78701" },
    },
    "Pay now",
  );
  expect(number).toMatch(/^GP-US-/);

  // Confirmation: the full amount is due now, nothing on delivery, and how to pay is shown.
  await expect(page.getByRole("heading", { name: "Your order", level: 1 })).toBeVisible();
  await expect(page.getByText(number, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Waiting for your payment", { exact: true })).toBeVisible();
  await expect(page.getByText("Amount to pay now")).toBeVisible();
  await expect(page.getByText(/when it is delivered/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Upload proof" })).toBeVisible();

  writeFixture({ usOrder: { number } });
});
