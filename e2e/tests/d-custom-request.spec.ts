import { expect, test } from "@playwright/test";

import { buildGift } from "../support/builder";
import { checkoutAndPlace } from "../support/checkout";
import { addCustomRequest, CUSTOM_REQUEST } from "../support/custom-request";
import { uniqueSuffix } from "../support/env";

test("a customer's own request is saved with the order and shown on the order page", async ({
  page,
}) => {
  const suffix = uniqueSuffix();

  await page.goto("/pk/build");
  await buildGift(page, "Bouquet");
  await addCustomRequest(page);

  const number = await checkoutAndPlace(
    page,
    {
      name: "Sara Khan",
      email: `e2e.request.${suffix}@example.com`,
      phone: "300 1234567",
      line1: "House 12, Street 4",
      city: "Lahore",
      region: { label: /^Province/, value: "Punjab" },
    },
    "Cash on delivery",
  );
  expect(number).toMatch(/^GP-PK-/);

  await expect(page.getByRole("heading", { name: "Your order", level: 1 })).toBeVisible();
  await expect(page.getByText("Your request", { exact: true })).toBeVisible();
  await expect(page.getByText(CUSTOM_REQUEST)).toBeVisible();
});
