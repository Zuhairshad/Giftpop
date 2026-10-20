import { expect, type Page } from "@playwright/test";

export const CUSTOM_REQUEST = "Please add a small handwritten note, and no nuts anywhere.";

/**
 * From the review question, steps back to "Who's it for?", fills the custom request and returns
 * to review. The textarea is labelled "Anything else you'd like?".
 */
export async function addCustomRequest(page: Page, text: string = CUSTOM_REQUEST): Promise<void> {
  const personalise = page.getByRole("heading", { name: "Who's it for?", level: 2 });
  await expect(async () => {
    if (await personalise.isVisible()) return;
    await page.getByRole("button", { name: /Back/ }).filter({ visible: true }).first().click();
    await expect(personalise).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });

  await page.getByLabel("Anything else you'd like?").fill(text);

  const review = page.getByRole("heading", { name: "Your gift is ready", level: 2 });
  await expect(async () => {
    if (await review.isVisible()) return;
    await page
      .getByRole("button", { name: /Continue to review/i })
      .filter({ visible: true })
      .first()
      .click();
    await expect(review).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
}
