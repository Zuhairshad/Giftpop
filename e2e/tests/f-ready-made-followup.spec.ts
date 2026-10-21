import { expect, test, type Page } from "@playwright/test";

import { personaliseAndReview } from "../support/builder";
import { giftCard, orderButton } from "../support/ready-made-gifts";

/** Seeded gifts (see scripts/seed/data/templates.ts): they have no saved design behind their share id. */
const SEEDED_TITLE = "Birthday chocolate bouquet";
const SEEDED_SHARE_ID = "gift-bday-choc-bouquet";
const OTHER_SEEDED_TITLE = "Birthday cupcake box";

/** Opens the gifts page and waits for a seeded gift (the web app caches the list for a while). */
async function openGifts(page: Page): Promise<void> {
  await expect(async () => {
    await page.goto("/us/gifts");
    await expect(page.getByRole("heading", { name: SEEDED_TITLE })).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 120_000, intervals: [1_000, 5_000, 10_000] });
}

async function orderSeededGift(page: Page, title: string): Promise<void> {
  await openGifts(page);
  await orderButton(giftCard(page, title)).click();
  await expect(page.getByRole("heading", { name: "Your gift is ready", level: 2 })).toBeVisible();
}

test("a seeded gift opens in the builder and the review step names it", async ({ page }) => {
  await orderSeededGift(page, SEEDED_TITLE);
  await expect(page.getByText("We could not open that gift")).toHaveCount(0);

  const status = page.getByRole("region", { name: SEEDED_TITLE });
  await expect(status).toBeVisible();
  await expect(status.getByText("Ordered as is")).toBeVisible();
  // The way on says "Order this gift" (a seeded gift asks for the missing details first).
  await expect(
    page
      .getByRole("link", { name: "Order this gift" })
      .or(page.getByRole("button", { name: /Order this gift|Add the missing details/ }))
      .first(),
  ).toBeVisible();
});

test("the review step says when the customer changed the gift", async ({ page }) => {
  await orderSeededGift(page, OTHER_SEEDED_TITLE);
  const status = page.getByRole("region", { name: OTHER_SEEDED_TITLE });
  await expect(status.getByText("Ordered as is")).toBeVisible();

  // Back to the colours question, pick a wrapper colour that is not the current one.
  const colours = page.getByRole("heading", { name: "Pick your colours", level: 2 });
  await expect(async () => {
    if (await colours.isVisible()) return;
    await page.getByRole("button", { name: /Back/ }).filter({ visible: true }).first().click();
    await expect(colours).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  for (const radio of await page.getByRole("radio").all()) {
    if (!(await radio.isChecked())) {
      await radio.check({ force: true });
      break;
    }
  }

  // Forward to the personalise question, fill it, and land on review again.
  const personalise = page.getByRole("heading", { name: "Who's it for?", level: 2 });
  const questionNumber = page.getByText(/^Question \d of 6$/).first();
  for (let step = 0; step < 5 && !(await personalise.isVisible()); step += 1) {
    const before = await questionNumber.innerText();
    await page
      .getByRole("button", { name: /Continue to (items|layout|personalise)/i })
      .filter({ visible: true })
      .first()
      .click();
    await expect(questionNumber).not.toHaveText(before);
  }
  await expect(personalise).toBeVisible();
  await personaliseAndReview(page);

  await expect(status.getByText("You changed this gift")).toBeVisible();
  await expect(status.getByText(/Different (wrapper|ribbon) colour/).first()).toBeVisible();
  await expect(status.getByText("The price may differ from the catalog card.")).toBeVisible();
});

test("a ready-made gift's share page carries its name for link previews", async ({ page }) => {
  const response = await page.goto(`/g/${SEEDED_SHARE_ID}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    `${SEEDED_TITLE} | The Giftpop`,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /\S+/);
});

test("the share button copies the gift's share link", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  await openGifts(page);
  const card = giftCard(page, SEEDED_TITLE);
  await card.getByRole("button", { name: `Share: ${SEEDED_TITLE}` }).click();
  await expect(card.getByText("Link copied.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    new RegExp(`/g/${SEEDED_SHARE_ID}$`),
  );
});

test("a card says so when the fresh list no longer has the gift", async ({ page }) => {
  // The page is drawn from a list cached for minutes; the browser then asks again.
  await page.route("**/api/templates?country=US*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await openGifts(page);
  const card = giftCard(page, SEEDED_TITLE);
  await expect(card.getByText("Not available right now").first()).toBeVisible();
  await expect(orderButton(card)).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Build your own gift" })).toBeVisible();
});

test("the gifts page keeps its cards when the fresh list cannot be read", async ({ page }) => {
  await page.route("**/api/templates?country=US*", (route) => route.abort());
  await openGifts(page);
  const card = giftCard(page, SEEDED_TITLE);
  await expect(orderButton(card)).toBeVisible();
  await expect(card.getByText("Not available right now")).toHaveCount(0);
});
