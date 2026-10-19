import { expect, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./overflow";

/** What the customer track page says for each status: the pill and the line under it. */
export const TRACK_COPY = {
  awaiting_payment: {
    label: "Waiting for your payment",
    hint: "Send your payment and we will confirm it.",
  },
  confirmed: {
    label: "Payment confirmed",
    hint: "We have your payment and will start on your gift.",
  },
  in_production: { label: "Being made by hand", hint: "We are making your gift by hand." },
  packed: {
    label: "Packed and ready for the courier",
    hint: "Your gift is packed. The courier will collect it soon.",
  },
  shipped: { label: "Shipped", hint: "Your gift is with the courier." },
  out_for_delivery: {
    label: "Out for delivery",
    hint: "The courier is on the way to the address.",
  },
  delivered: { label: "Delivered", hint: "Your gift has arrived." },
} as const;

export type TrackedStatus = keyof typeof TRACK_COPY;

const TOO_MANY = "Too many tries. Wait a minute, then try again.";

/**
 * Presses "Track order". Lookups are limited to 10 per minute per IP (the order page and
 * the proof upload count too), so a flow that tracks after every step can hit the limit.
 * That is the product working as designed: wait out the minute and press again.
 */
async function submitLookup(page: Page, number: string): Promise<void> {
  const button = page.getByRole("button", { name: "Track order" });
  const found = page.getByText(number, { exact: true }).first();
  const limited = page.getByText(TOO_MANY);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.click();
    await expect(found.or(limited)).toBeVisible();
    if (!(await limited.isVisible())) return;
    await page.waitForTimeout(61_000);
  }
}

/**
 * Looks the order up on `/track` the way a customer does (order number and the phone used)
 * and checks the page shows `status`. Also checks the page is not wider than the screen.
 */
export async function expectTrackStatus(
  page: Page,
  order: { number: string; phone: string },
  status: TrackedStatus,
): Promise<void> {
  await page.goto("/track");
  await page.getByLabel("Order number").fill(order.number);
  await page.getByLabel("Phone or email used to order").fill(order.phone);
  await submitLookup(page, order.number);

  const copy = TRACK_COPY[status];
  await expect(page.getByText(order.number, { exact: true }).first()).toBeVisible();
  // The header comes first on the page; the timeline below repeats the words of past steps.
  await expect(page.getByText(copy.hint, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(copy.label, { exact: true }).first()).toBeVisible();

  await expectNoHorizontalOverflow(page, `/track at ${status}`);
}
