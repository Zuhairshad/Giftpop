import { expect, type Page } from "@playwright/test";

export interface Buyer {
  name: string;
  email: string;
  /** Typed as a customer would, without the country dial code. */
  phone: string;
  line1: string;
  city: string;
  /** Province, State and so on: the label comes from the country document. */
  region: { label: RegExp; value: string };
  postalCode?: { label: RegExp; value: string };
}

/** From the review step to the order page: fills checkout and places the order. */
export async function checkoutAndPlace(
  page: Page,
  buyer: Buyer,
  mode: "Pay now" | "Cash on delivery",
): Promise<string> {
  await page
    .getByRole("link", { name: /Continue to checkout/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/checkout/);

  await page.getByLabel("Full name").fill(buyer.name);
  await page.getByLabel("Email").fill(buyer.email);
  await page.getByLabel("Phone").fill(buyer.phone);
  await page.getByLabel("Address line 1").fill(buyer.line1);
  await page.getByLabel("City").fill(buyer.city);
  await page.getByLabel(buyer.region.label).fill(buyer.region.value);
  if (buyer.postalCode) await page.getByLabel(buyer.postalCode.label).fill(buyer.postalCode.value);

  // The payment cards appear once the quote has loaded.
  const choice = page.getByRole("radio", { name: new RegExp(mode, "i") });
  await choice.check({ force: true });
  await expect(choice).toBeChecked();

  await page.getByRole("button", { name: /Place order/i }).click();
  await page.waitForURL(/\/order\/GP-[A-Z]{2}-[A-Z0-9]{6}/);
  const number = /\/order\/(GP-[A-Z]{2}-[A-Z0-9]{6})/.exec(page.url())?.[1];
  expect(number).toBeTruthy();
  return number as string;
}
