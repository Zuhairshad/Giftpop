import { expect, test } from "@playwright/test";

import { signInAsStaff } from "../support/admin";
import { ADMIN_URL, uniqueSuffix } from "../support/env";
import { writeFixture } from "../support/fixture";

test("a brand partner request reaches the admin inbox and staff mark it in talks", async ({
  page,
}) => {
  const brandName = `E2E Honey ${uniqueSuffix()}`;

  // The public partners page leads to the brand form.
  await page.goto("/partners");
  await page.getByRole("link", { name: "Tell us about your brand" }).click();
  await expect(page).toHaveURL(/\/partners\/brands/);

  await page.getByLabel("Brand name").fill(brandName);
  await page.getByLabel("Contact name").fill("Maryam Ali");
  await page.getByLabel("Email").fill(`maryam.${uniqueSuffix()}@example.com`);
  await page.getByLabel("Phone").fill("+92 300 5551234");
  await page.getByLabel("Country", { exact: true }).selectOption({ label: "Pakistan" });
  await page.getByLabel("Product categories").fill("candles, honey");
  await page.getByLabel("Website or Instagram").fill("https://instagram.com/e2ehoney");
  await page
    .getByLabel("Message")
    .fill("We make small-batch candles and would love to be in a box.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/Thank you/).first()).toBeVisible();
  writeFixture({ partnerRequest: { brandName } });

  // Staff find it in the partners inbox.
  await signInAsStaff(page);
  await page.goto(`${ADMIN_URL}/partners`);
  await page.getByRole("button", { name: new RegExp(brandName) }).click();

  const detail = page.getByRole("dialog");
  await expect(detail.getByText(brandName).first()).toBeVisible();
  await expect(detail.getByText("Maryam Ali")).toBeVisible();

  // Mark it as in talks with a note, and save.
  await detail.getByLabel("Status").click();
  await page.getByRole("option", { name: "In talks" }).click();
  await detail.getByLabel("Add note").fill("Called Maryam and sent a sample box.");
  await detail.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Request saved")).toBeVisible();
  await expect(detail.getByText("Called Maryam and sent a sample box.")).toBeVisible();

  // The inbox shows the new status for that request.
  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();
  const row = page.getByRole("row", { name: new RegExp(brandName) });
  await expect(row.getByText("In talks")).toBeVisible();
});
