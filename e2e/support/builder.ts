import { expect, type Page } from "@playwright/test";

export const CARD_MESSAGE = "Happy birthday, with love from the end-to-end tests!";
export const RECIPIENT = "Amna";

/**
 * Presses a "Continue" button until the next question's title shows. The builder is one page:
 * the URL does not change between questions. A press before the page has hydrated does nothing,
 * so it is repeated.
 */
async function advance(page: Page, name: RegExp, nextTitle: string): Promise<void> {
  const control = page.getByRole("button", { name }).filter({ visible: true }).first();
  const title = page.getByRole("heading", { name: nextTitle, level: 2 });
  await expect(async () => {
    if (await title.isVisible()) return;
    await control.click();
    await expect(title).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Builds a gift with the guided builder, starting on its first question ("What should your gift
 * come in?"), and stops on the review question with the price shown. Uses only roles, labels and
 * visible text.
 */
export async function buildGift(page: Page, formatName: string): Promise<void> {
  // 1. Packaging.
  await expect(
    page.getByRole("heading", { name: "What should your gift come in?", level: 2 }),
  ).toBeVisible();
  const format = page.getByRole("button", { name: new RegExp(`^${formatName}`, "i") });
  await expect(async () => {
    await format.first().click();
    await expect(page.getByRole("button", { name: /Continue to colours/i })).toBeEnabled({
      timeout: 3_000,
    });
  }).toPass({ timeout: 30_000 });
  await advance(page, /Continue to colours/i, "Pick your colours");

  // 2. Colours.
  await page
    .getByRole("radio", { name: /Kraft|Cream|Ivory/ })
    .first()
    .check({ force: true });
  await advance(page, /Continue to items/i, "What goes inside?");

  // 3. Items: add distinct items until the counter reaches the minimum.
  const counter = page
    .getByText(/\d+ of \d+(–\d+)? picked/)
    .filter({ visible: true })
    .first();
  await expect(counter).toBeVisible();
  const minimum = Number(/of (\d+)/.exec((await counter.innerText()) ?? "")?.[1]);
  expect(minimum).toBeGreaterThan(0);
  for (let picked = 0; picked < minimum; ) {
    const candidates = await page.getByRole("button", { name: /^Add (?!one more)/ }).all();
    let added = false;
    for (const candidate of candidates) {
      if (await candidate.isEnabled()) {
        await candidate.click();
        added = true;
        break;
      }
    }
    expect(added, "an item that can still be added").toBe(true);
    picked += 1;
    await expect(counter).toHaveText(new RegExp(`^${picked} of `));
  }
  await advance(page, /Continue to layout/i, "Happy with the layout?");

  // 4. Layout: shuffle and move the last item up.
  await page.getByRole("button", { name: "Shuffle" }).click();
  const moveUp = page.getByRole("button", { name: /^Move .* up$/ }).last();
  if (await moveUp.isEnabled()) await moveUp.click();
  await advance(page, /Continue to personalise/i, "Who's it for?");

  // 5. Personalise.
  await page.getByLabel(/Card message/i).fill(CARD_MESSAGE);
  await page.getByLabel(/Recipient/i).fill(RECIPIENT);
  await advance(page, /Continue to review/i, "Your gift is ready");

  // 6. Review.
  await expect(page.getByText(/Pay now/i).first()).toBeVisible();
}
