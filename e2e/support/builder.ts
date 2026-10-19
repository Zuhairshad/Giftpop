import { expect, type Page } from "@playwright/test";

export const CARD_MESSAGE = "Happy birthday, with love from the end-to-end tests!";
export const RECIPIENT = "Amna";

/** Presses a "Continue" control (a link or a button) until the URL changes to the next step. */
async function advance(page: Page, name: RegExp, next: RegExp): Promise<void> {
  const control = page
    .getByRole("link", { name })
    .or(page.getByRole("button", { name }))
    .filter({ visible: true })
    .first();
  await expect(async () => {
    if (next.test(page.url())) return;
    await control.click();
    await expect(page).toHaveURL(next, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Builds a gift with the visual builder, starting on the format step, and
 * stops on the review step with the price shown. Uses only roles, labels and visible text.
 */
export async function buildGift(page: Page, formatName: string): Promise<void> {
  // Step 1, format.
  // Choosing a format moves on to the items step by itself. A click before the page has
  // hydrated does nothing, so press again until the step changes.
  await expect(async () => {
    if (/\/build\/items/.test(page.url())) return;
    await page.getByRole("button", { name: new RegExp(`^${formatName}`, "i") }).click();
    await expect(page).toHaveURL(/\/build\/items/, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });

  // Step 2, items: add distinct items until the counter reaches the minimum.
  const counter = page
    .getByText(/\d+ of \d+(–\d+)? picked/)
    .filter({ visible: true })
    .first();
  await expect(counter).toBeVisible();
  const minimum = Number(/of (\d+)/.exec((await counter.innerText()) ?? "")?.[1]);
  expect(minimum).toBeGreaterThan(0);
  for (let picked = 0; picked < minimum;) {
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
  await advance(page, /Continue to arrange/i, /\/build\/arrange/);

  // Step 3, arrange: shuffle, move the last item up, change the wrapper colour.
  await page.getByRole("button", { name: "Shuffle" }).click();
  const moveUp = page.getByRole("button", { name: /^Move .* up$/ }).last();
  if (await moveUp.isEnabled()) await moveUp.click();
  await page
    .getByRole("radio", { name: /Kraft|Cream|Ivory/ })
    .first()
    .check({ force: true });
  await advance(page, /Continue to personalise/i, /\/build\/personalise/);

  // Step 4, personalise.
  await page.getByLabel(/Card message/i).fill(CARD_MESSAGE);
  await page.getByLabel(/Recipient/i).fill(RECIPIENT);
  await advance(page, /Continue to review/i, /\/build\/review/);

  // Step 5, review.
  await expect(page.getByText(/Pay now/i).first()).toBeVisible();
}
