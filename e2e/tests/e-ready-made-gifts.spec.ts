import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { signInAsStaff } from "../support/admin";
import { CARD_MESSAGE } from "../support/builder";
import { ADMIN_URL, uniqueSuffix } from "../support/env";
import { FEATURED_TEMPLATE_TITLE } from "../support/featured-template";
import { expectNoHorizontalOverflow } from "../support/overflow";
import {
  BIRTHDAY_GIFT,
  THANK_YOU_GIFT,
  ensureReadyMadeGifts,
  fetchPublicGifts,
  fillMissingDetails,
  giftCard,
  orderButton,
  orderFromReview,
  reviewTotalMinor,
  usdToMinor,
  type PublicGift,
} from "../support/ready-made-gifts";

// The tests share one order: the customer places it, staff open it. They run in file order.
test.describe.configure({ mode: "serial" });

const SHOTS = path.join(__dirname, "..", "test-results");

/** What the customer test hands to the staff test. */
const placed: { number?: string; gift?: PublicGift; cardMinor?: number } = {};

test.beforeAll(async () => {
  // Idempotent: creates only what is missing. Global setup does not know about these gifts.
  await ensureReadyMadeGifts();
});

/** Opens the page and waits for the gifts. The web app caches the list for a while, so a stale empty page is retried. */
async function openGifts(page: Page, query = ""): Promise<void> {
  await expect(async () => {
    await page.goto(`/us/gifts${query}`);
    await expect(
      page
        .getByRole("heading", { name: BIRTHDAY_GIFT.title })
        .or(page.getByRole("heading", { name: THANK_YOU_GIFT.title })),
    ).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000, intervals: [1_000, 5_000, 10_000] });
}

async function ourGifts(): Promise<{
  birthday: PublicGift;
  thankYou: PublicGift;
  all: PublicGift[];
}> {
  const all = await fetchPublicGifts("US");
  const birthday = all.find((g) => g.title === BIRTHDAY_GIFT.title);
  const thankYou = all.find((g) => g.title === THANK_YOU_GIFT.title);
  expect(birthday, "the birthday gift is in the public US list").toBeDefined();
  expect(thankYou, "the thank-you gift is in the public US list").toBeDefined();
  return { birthday: birthday as PublicGift, thankYou: thankYou as PublicGift, all };
}

/** How many cards the page shows: one "Order this gift" action per card. */
async function cardCount(page: Page): Promise<number> {
  return page
    .getByRole("button", { name: /^Order this gift/ })
    .or(page.getByRole("link", { name: /^Order this gift/ }))
    .count();
}

test("the ready-made gifts page lists each gift with picture, contents and price, and filters by category", async ({
  page,
}) => {
  const { birthday, thankYou, all } = await ourGifts();
  await openGifts(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The API computes the price: a zero here means the quote was never worked out.
  for (const gift of [birthday, thankYou]) {
    expect(gift.priceMinor, `${gift.title} has a price from the API`).toBeGreaterThan(0);
    expect(gift.currency).toBe("USD");
  }

  // Each card: picture, title, "What is inside", price in dollars equal to the API's number.
  for (const gift of [birthday, thankYou]) {
    const card = giftCard(page, gift.title);
    await expect(card).toBeVisible();
    await expect(card.getByRole("img").first()).toBeVisible();
    await expect(card.getByText("What is inside")).toBeVisible();
    for (const name of gift.itemSummary.names) {
      await expect(card.getByText(name, { exact: false }).first()).toBeVisible();
    }
    if (gift.itemSummary.moreCount > 0) {
      await expect(card.getByText(`+${gift.itemSummary.moreCount} more`)).toBeVisible();
    } else {
      await expect(card.getByText(/\+\d+ more/)).toHaveCount(0);
    }
    expect(usdToMinor(await card.innerText()), `${gift.title} price on the card`).toBe(
      gift.priceMinor,
    );
    await expect(orderButton(card)).toBeVisible();
  }

  // The featured gift comes first among ours (the others are sorted by sort order, then title).
  const titles = await page.getByRole("heading", { name: /^E2E / }).allInnerTexts();
  expect(titles.indexOf(BIRTHDAY_GIFT.title), "featured gift first").toBeLessThan(
    titles.indexOf(THANK_YOU_GIFT.title),
  );
  expect(titles.indexOf(BIRTHDAY_GIFT.title)).toBeLessThan(
    titles.includes(FEATURED_TEMPLATE_TITLE) ? titles.indexOf(FEATURED_TEMPLATE_TITLE) : Infinity,
  );
  expect(await cardCount(page), "one card per live gift").toBe(all.length);

  // The chips are the categories of live gifts, each a real link.
  const birthdayChip = page.getByRole("link", { name: /^Birthday/ });
  const thankYouChip = page.getByRole("link", { name: /^Thank you/ });
  const allChip = page.getByRole("link", { name: /^All gifts/ });
  await expect(birthdayChip).toHaveAttribute("href", /category=birthday/);
  await expect(thankYouChip).toHaveAttribute("href", /category=thank-you/);

  // Filter: only matching cards remain, and the URL says so.
  await birthdayChip.click();
  await expect(page).toHaveURL(/\/us\/gifts\?category=birthday$/);
  await expect(page.getByRole("heading", { name: BIRTHDAY_GIFT.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: THANK_YOU_GIFT.title })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: FEATURED_TEMPLATE_TITLE })).toHaveCount(0);
  const birthdayOnly = all.filter((g) => g.category?.slug === "birthday").length;
  await expect.poll(() => cardCount(page)).toBe(birthdayOnly);

  await thankYouChip.click();
  await expect(page).toHaveURL(/\/us\/gifts\?category=thank-you$/);
  await expect(page.getByRole("heading", { name: THANK_YOU_GIFT.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: BIRTHDAY_GIFT.title })).toHaveCount(0);
  const thankYouOnly = all.filter((g) => g.category?.slug === "thank-you").length;
  await expect.poll(() => cardCount(page)).toBe(thankYouOnly);

  // "All gifts" restores everything; a gift with no category only shows here.
  await allChip.click();
  await expect(page).not.toHaveURL(/category=/);
  await expect(page.getByRole("heading", { name: BIRTHDAY_GIFT.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: THANK_YOU_GIFT.title })).toBeVisible();
  await expect.poll(() => cardCount(page)).toBe(all.length);

  // The filtered page also works when opened directly, as a shared link.
  await page.goto("/us/gifts?category=thank-you");
  await expect(page.getByRole("heading", { name: THANK_YOU_GIFT.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: BIRTHDAY_GIFT.title })).toHaveCount(0);
});

test("a customer orders a ready-made gift at the price on its card", async ({ page }) => {
  const suffix = uniqueSuffix();
  const { birthday } = await ourGifts();
  await openGifts(page, "?category=birthday");

  const card = giftCard(page, BIRTHDAY_GIFT.title);
  await expect(card).toBeVisible();
  const cardMinor = usdToMinor(await card.innerText());
  expect(cardMinor).toBe(birthday.priceMinor);

  // The button opens the builder's review step, pre-filled with the gift.
  await orderButton(card).click();
  await expect(page).toHaveURL(/\/us\/build\/review/);
  await expect(page.getByRole("heading", { name: "Your gift is ready", level: 2 })).toBeVisible();

  // Server owns money: an untouched gift costs what its card said.
  expect(await reviewTotalMinor(page), "review total equals the card price").toBe(cardMinor);

  // Text fields arrive empty and are required: the gift asks for them before it can be ordered.
  await fillMissingDetails(page);
  expect(await reviewTotalMinor(page), "personalising never changes the price").toBe(cardMinor);
  await expect(orderButton(page)).toBeVisible();

  // Checkout the way the template spec does (cash on delivery, 20% advance), US address.
  const number = await orderFromReview(
    page,
    {
      name: "Jordan Lee",
      email: `e2e.gifts.${suffix}@example.com`,
      phone: "512 555 0100",
      line1: "500 Congress Ave",
      city: "Austin",
      region: { label: /^State/, value: "Texas" },
      postalCode: { label: /^ZIP/, value: "78701" },
    },
    "Cash on delivery",
  );
  expect(number).toMatch(/^GP-US-/);
  await expect(page.getByRole("heading", { name: "Your order", level: 1 })).toBeVisible();
  await expect(page.getByText(number, { exact: true }).first()).toBeVisible();

  placed.number = number;
  placed.gift = birthday;
  placed.cardMinor = cardMinor;
});

test("staff see the frozen gift and the same total in the admin app", async ({ page }) => {
  const { number, gift, cardMinor } = placed;
  expect(number, "the customer test has to place the order first").toBeDefined();
  if (!number || !gift || cardMinor === undefined) return;

  await signInAsStaff(page);
  await page.goto(`${ADMIN_URL}/orders`);
  await page.getByLabel("Search").fill(number);
  await expect(page).toHaveURL(/search=/);
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.getByRole("link", { name: number }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f]{24}$/);
  await expect(page.getByRole("heading", { name: new RegExp(number) })).toBeVisible();

  // The item snapshot: every item of the gift, once each, plus the packaging line.
  const giftPanel = page.getByRole("region", { name: "The gift" });
  for (const item of gift.items) {
    await expect(giftPanel.getByRole("rowheader", { name: item.name, exact: true })).toBeVisible();
  }
  await expect(giftPanel.getByRole("rowheader", { name: /^Packaging:/ })).toBeVisible();
  // Header row + one row per item + the packaging row.
  await expect(giftPanel.getByRole("row")).toHaveCount(gift.items.length + 2);

  // The frozen design: the customer's recipient and card message came in on top of the gift.
  await expect(giftPanel.getByText(CARD_MESSAGE)).toBeVisible();

  // The total the customer saw on the card, the review and the order.
  const payment = page.getByRole("region", { name: "Payment" });
  const total = payment
    .getByText("Total", { exact: true })
    .locator("xpath=following-sibling::dd[1]");
  expect(usdToMinor(await total.innerText()), "admin total equals the card price").toBe(cardMinor);
  await expect(payment.getByText("Advance now, rest on delivery").first()).toBeVisible();
});

test.describe("no horizontal overflow on the gifts page", () => {
  // A plain context: `isMobile` grows the window to fit any overflow, so it could never fail.
  test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  for (const width of [320, 360, 375, 390]) {
    test(`gifts page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await openGifts(page);
      await expectNoHorizontalOverflow(page, `/us/gifts at ${width}px`);
      await page.goto("/us/gifts?category=birthday");
      await expect(page.getByRole("heading", { name: BIRTHDAY_GIFT.title })).toBeVisible();
      await expectNoHorizontalOverflow(page, `/us/gifts?category=birthday at ${width}px`);
    });
  }
});

test.describe("screenshots of the gifts page", () => {
  test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1280, height: 900 },
  ]) {
    test(`gifts page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openGifts(page);
      await expect(page.getByRole("img").first()).toBeVisible();
      // Park the mouse off every control (a hover state would look like a pressed button) and let
      // fonts and any motion settle before looking at pixels.
      await page.mouse.move(width - 2, Math.floor(height / 2));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1_500);
      await page.screenshot({
        path: path.join(SHOTS, `ready-made-gifts-${width}.png`),
        fullPage: true,
      });
    });
  }
});
