import { expect, test, type Page } from "@playwright/test";

import { buildGiftToPersonalise, personaliseAndReview } from "../support/builder";
import { expectNoHorizontalOverflow } from "../support/overflow";

const REASONS = {
  recipient: "Enter who the gift is for",
  message: "Write a card message",
  items: "Add a name for each personalised item",
};

async function startPersonalise(page: Page): Promise<void> {
  await page.goto("/pk/build");
  await buildGiftToPersonalise(page, "Bouquet");
}

function continueButton(page: Page) {
  return page
    .getByRole("button", { name: /Continue to review/i })
    .filter({ visible: true })
    .first();
}

async function openCheckout(page: Page): Promise<void> {
  await personaliseAndReview(page);
  await page
    .getByRole("link", { name: /Continue to checkout/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/checkout/);
}

test("the personalise step names what is missing until every answer is filled", async ({
  page,
}) => {
  await startPersonalise(page);
  const button = continueButton(page);
  const names = page.getByLabel(/^Name on /);
  expect(await names.count(), "a personalisable item in the Bouquet").toBeGreaterThan(0);

  await expect(button).toBeDisabled();
  await expect(page.getByText(REASONS.recipient).first()).toBeVisible();

  await page.getByLabel(/Recipient/i).fill("Amna");
  await expect(button).toBeDisabled();
  await expect(page.getByText(REASONS.message).first()).toBeVisible();

  await page.getByLabel(/Card message/i).fill("Happy birthday!");
  await expect(button).toBeDisabled();
  await expect(page.getByText(REASONS.items).first()).toBeVisible();

  for (const field of await names.all()) await field.fill("Amna");
  await expect(button).toBeEnabled();
  for (const reason of Object.values(REASONS)) {
    await expect(page.getByText(reason)).toHaveCount(0);
  }

  // Clearing a field blocks the step again.
  await page.getByLabel(/Recipient/i).fill("");
  await expect(button).toBeDisabled();
  await expect(page.getByText(REASONS.recipient).first()).toBeVisible();
});

test("name fields drop digits and symbols while the card message takes free text", async ({
  page,
}) => {
  await startPersonalise(page);

  const recipient = page.getByLabel(/Recipient/i);
  await recipient.pressSequentially("Am1n@a 42!");
  await expect(recipient).toHaveValue("Amna ");

  const itemName = page.getByLabel(/^Name on /).first();
  await itemName.pressSequentially("Sa7r$a 9");
  await expect(itemName).toHaveValue("Sara ");

  const message = page.getByLabel(/Card message/i);
  const free = "Happy 30th, 100% yours! #love :)";
  await message.fill(free);
  await expect(message).toHaveValue(free);
});

test("checkout fields drop what they never hold and cut pasted text to the cap", async ({
  page,
}) => {
  await startPersonalise(page);
  await openCheckout(page);

  const phone = page.getByLabel("Phone");
  const name = page.getByLabel("Full name");
  const city = page.getByLabel("City");
  const region = page.getByLabel(/^Province/);
  const line1 = page.getByLabel("Address line 1");

  await phone.pressSequentially("3a0b0-1 2c34567");
  await expect(phone).toHaveValue("3001234567");
  await name.pressSequentially("Sara 2 Khan");
  await expect(name).toHaveValue("Sara  Khan");
  await city.pressSequentially("Lah0re 5");
  await expect(city).toHaveValue("Lahre ");
  await region.pressSequentially("Pun1jab");
  await expect(region).toHaveValue("Punjab");

  // Over-long pasted text is cut to each field's cap.
  const long = "a".repeat(500);
  await name.fill(long);
  await expect(name).toHaveValue("a".repeat(80));
  await city.fill(long);
  await expect(city).toHaveValue("a".repeat(80));
  await line1.fill(long);
  await expect(line1).toHaveValue("a".repeat(120));
  await phone.fill("1".repeat(40));
  await expect(phone).toHaveValue("1".repeat(15));
});

test.describe("no horizontal overflow at phone widths", () => {
  test.use({ isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  for (const width of [320, 360, 375, 390]) {
    test(`personalise step and checkout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await startPersonalise(page);

      // A long unbroken string is the worst case (see Lessons).
      await page.getByLabel(/Card message/i).fill("W".repeat(300));
      await expectNoHorizontalOverflow(page, `personalise at ${width}px`);

      await openCheckout(page);
      await page.getByLabel("Address line 1").fill("x".repeat(120));
      await page.getByLabel("City").fill("y".repeat(80));
      await expectNoHorizontalOverflow(page, `checkout at ${width}px`);
    });
  }
});
