import { expect, test, type Page } from "@playwright/test";

import { signInAsStaff } from "../support/admin";
import { ADMIN_URL, WEB_URL } from "../support/env";
import { readFixture } from "../support/fixture";
import { expectNoHorizontalOverflow } from "../support/overflow";
import { expectTrackStatus, type TrackedStatus } from "../support/track";

const COURIER = "TCS";
const TRACKING_NUMBER = "TCS123456789";

/** Opens the status menu on the order page and picks one action. */
async function pickAction(page: Page, action: string): Promise<void> {
  await page.getByRole("button", { name: "Change status" }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

test("staff fulfil the Pakistan order and the customer sees every step", async ({
  page,
  browser,
}) => {
  const order = readFixture().pkOrder;
  expect(order, "test (a) has to place the Pakistan order first").toBeDefined();
  if (!order) return;

  // The customer checks from a plain (non-mobile) 390px window: `isMobile` would grow the
  // viewport to fit any overflow, so it could never report one.
  const customerContext = await browser.newContext({
    baseURL: WEB_URL,
    viewport: { width: 390, height: 844 },
  });
  const customer = await customerContext.newPage();

  try {
    // Staff sign in and find the order in the list by its number.
    await signInAsStaff(page);
    await page.goto(`${ADMIN_URL}/orders`);
    await page.getByLabel("Search").fill(order.number);
    // The list narrows to the one matching row (plus the header row) before we click.
    await expect(page).toHaveURL(/search=/);
    await expect(page.getByRole("row")).toHaveCount(2);
    await page.getByRole("link", { name: order.number }).click();
    await expect(page).toHaveURL(/\/orders\/[0-9a-f]{24}$/);
    await expect(page.getByRole("heading", { name: new RegExp(order.number) })).toBeVisible();
    await expectNoHorizontalOverflow(page, "the admin order page");

    // Accept the proof the customer uploaded, then record the advance.
    await page.getByRole("button", { name: "Accept proof" }).click();
    await expect(page.getByText("Proof accepted")).toBeVisible();

    await page.getByRole("button", { name: "Record payment" }).click();
    const payment = page.getByRole("dialog");
    // The amount is pre-filled with what is due now (the 20% advance for cash on delivery).
    await expect(payment.getByLabel(/Amount received/)).not.toHaveValue("");
    await payment.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText("Payment recorded")).toBeVisible();
    await expect(payment).toBeHidden();
    // Recording the advance confirms an order that was waiting for payment.
    await expectTrackStatus(customer, order, "confirmed");

    const steps: { action: string; status: TrackedStatus }[] = [
      { action: "Start production", status: "in_production" },
      { action: "Mark as packed", status: "packed" },
    ];
    for (const step of steps) {
      await pickAction(page, step.action);
      await page.getByRole("dialog").getByRole("button", { name: step.action }).click();
      await expect(page.getByText(`${step.action}: done`)).toBeVisible();
      await expectTrackStatus(customer, order, step.status);
    }

    // Shipping needs a courier and a tracking number.
    await pickAction(page, "Mark as shipped");
    const ship = page.getByRole("dialog");
    await ship.getByRole("button", { name: "Mark as shipped" }).click();
    await expect(ship.getByText(/courier/i).first()).toBeVisible();
    await ship.getByLabel("Courier").fill(COURIER);
    await ship.getByLabel("Tracking number").fill(TRACKING_NUMBER);
    await ship.getByRole("button", { name: "Mark as shipped" }).click();
    await expect(page.getByText("Mark as shipped: done")).toBeVisible();
    await expectTrackStatus(customer, order, "shipped");
    await expect(customer.getByText(COURIER, { exact: true })).toBeVisible();
    await expect(customer.getByText(TRACKING_NUMBER, { exact: true })).toBeVisible();

    const last: { action: string; status: TrackedStatus }[] = [
      { action: "Mark as out for delivery", status: "out_for_delivery" },
      { action: "Mark as delivered", status: "delivered" },
    ];
    for (const step of last) {
      await pickAction(page, step.action);
      await page.getByRole("dialog").getByRole("button", { name: step.action }).click();
      await expect(page.getByText(`${step.action}: done`)).toBeVisible();
      await expectTrackStatus(customer, order, step.status);
    }

    // A delivered order is closed: the menu has nothing left to offer.
    await expect(page.getByRole("button", { name: "Change status" })).toBeDisabled();
  } finally {
    await customerContext.close();
  }
});
