import { expect, type Locator, type Page } from "@playwright/test";

import { personaliseAndReview } from "./builder";
import type { Buyer } from "./checkout";
import { API_URL, STAFF_EMAIL, STAFF_PASSWORD } from "./env";

/** One ready-made gift the end-to-end run owns. Titles start with "E2E gift" so they never clash with seed data. */
export interface ReadyMadeGiftSpec {
  title: string;
  category: { slug: string; name: string };
  featured: boolean;
}

export const BIRTHDAY_GIFT: ReadyMadeGiftSpec = {
  title: "E2E gift birthday",
  category: { slug: "birthday", name: "Birthday" },
  featured: true,
};
export const THANK_YOU_GIFT: ReadyMadeGiftSpec = {
  title: "E2E gift thank you",
  category: { slug: "thank-you", name: "Thank you" },
  featured: false,
};
export const READY_MADE_GIFTS: readonly ReadyMadeGiftSpec[] = [BIRTHDAY_GIFT, THANK_YOU_GIFT];

interface CatalogItem {
  item: { id: string; sizeUnits: number; personalizable?: boolean };
  inStock: boolean;
}
interface CatalogPackaging {
  packaging: {
    id: string;
    slug: string;
    minItems: number;
    capacityUnits: number;
    wrapperColors: { hex: string }[];
    ribbonColors: { hex: string }[];
  };
  inStock: boolean;
}
interface StaffTemplate {
  id: string;
  title: string;
  active: boolean;
  countries: string[];
  category: { slug: string } | null;
  featured: boolean;
}

async function json<T>(response: Response, what: string): Promise<T> {
  if (!response.ok) throw new Error(`${what} failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as T;
}

/** Logs in as staff through the API and returns the session cookie. Login is limited to 5 a minute. */
async function staffCookie(): Promise<string> {
  const login = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Staff login failed: ${login.status}`);
  return (login.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
}

async function saveDesign(
  packaging: CatalogPackaging["packaging"],
  itemIds: string[],
  seed: number,
  cardMessage: string,
): Promise<string> {
  const saved = await json<{ shareId: string }>(
    await fetch(`${API_URL}/v1/designs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country: "US",
        design: {
          packagingId: packaging.id,
          items: itemIds.map((itemId, slot) => ({ itemId, qty: 1, slot })),
          wrapperColor: packaging.wrapperColors[0]?.hex,
          ribbonColor: packaging.ribbonColors[0]?.hex,
          arrangementSeed: seed,
          personalisation: { cardMessage, recipientName: "", itemNames: {} },
        },
      }),
    }),
    "Save design",
  );
  return saved.shareId;
}

/**
 * Makes sure each `READY_MADE_GIFTS` entry exists as an active US template with its category and
 * featured flag, through the same public and staff API routes the apps use (never the seed).
 * Safe to run on every run: a gift that is already right is left alone, one that drifted is
 * patched back, a missing one is created from a design saved here. Pass the staff cookie that
 * global setup already holds to save a login.
 */
export async function ensureReadyMadeGifts(cookie?: string): Promise<void> {
  const session = cookie ?? (await staffCookie());
  const staff = { "content-type": "application/json", cookie: session };
  const existing = await json<StaffTemplate[]>(
    await fetch(`${API_URL}/v1/templates/admin`, { headers: staff }),
    "List templates",
  );

  const missing: ReadyMadeGiftSpec[] = [];
  for (const spec of READY_MADE_GIFTS) {
    const found = existing.find((t) => t.title === spec.title);
    if (!found) {
      missing.push(spec);
      continue;
    }
    const right =
      found.active &&
      found.countries.includes("US") &&
      found.category?.slug === spec.category.slug &&
      found.featured === spec.featured;
    if (right) continue;
    await json(
      await fetch(`${API_URL}/v1/templates/admin/${found.id}`, {
        method: "PATCH",
        headers: staff,
        body: JSON.stringify({
          active: true,
          countries: ["US"],
          category: spec.category,
          featured: spec.featured,
        }),
      }),
      `Patch template "${spec.title}"`,
    );
  }
  if (missing.length === 0) return;

  const catalog = await json<{ packagings: CatalogPackaging[]; items: CatalogItem[] }>(
    await fetch(`${API_URL}/v1/catalog?country=US`),
    "Catalog",
  );
  const bouquet = catalog.packagings.find((p) => p.packaging.slug === "bouquet" && p.inStock);
  if (!bouquet) throw new Error("The US catalog has no bouquet");
  const { packaging } = bouquet;
  // Smallest unnamed items first so the minimum count always fits. Each gift takes the next
  // slice of the list so the cards differ; when a slice does not fit it falls back to the first.
  const pool = catalog.items
    .filter((entry) => entry.inStock && !entry.item.personalizable)
    .sort((a, b) => a.item.sizeUnits - b.item.sizeUnits);
  const fits = (slice: CatalogItem[]): boolean =>
    slice.length === packaging.minItems &&
    slice.reduce((sum, entry) => sum + entry.item.sizeUnits, 0) <= packaging.capacityUnits;
  const first = pool.slice(0, packaging.minItems);
  if (!fits(first)) throw new Error("The US catalog cannot fill a bouquet");

  for (const [index, spec] of missing.entries()) {
    const slice = pool.slice(index * packaging.minItems, (index + 1) * packaging.minItems);
    const picked = fits(slice) ? slice : first;
    const shareId = await saveDesign(
      packaging,
      picked.map((entry) => entry.item.id),
      7 + index,
      "",
    );
    await json(
      await fetch(`${API_URL}/v1/templates/admin`, {
        method: "POST",
        headers: staff,
        body: JSON.stringify({
          title: spec.title,
          description: "Made by the end-to-end tests.",
          shareId,
          countries: ["US"],
          category: spec.category,
          featured: spec.featured,
        }),
      }),
      `Create template "${spec.title}"`,
    );
  }
}

/** What `GET /v1/templates?country=US` returns for one gift, narrowed to what the spec compares. */
export interface PublicGift {
  title: string;
  priceMinor: number;
  currency: string;
  category: { slug: string; name: string } | null;
  featured: boolean;
  itemSummary: { names: string[]; moreCount: number };
  items: { name: string }[];
}

/** The public list as the page's own API call sees it: the source of truth the cards must match. */
export async function fetchPublicGifts(country = "US"): Promise<PublicGift[]> {
  return json<PublicGift[]>(
    await fetch(`${API_URL}/v1/templates?country=${country}`),
    "Public templates",
  );
}

/**
 * Turns a displayed price such as "$1,234.50" or "$54" into integer minor units (cents) by
 * reading the digits as text, so the test never does float maths on money. USD only.
 */
export function usdToMinor(text: string): number {
  const match = /\$\s?(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?/.exec(text);
  if (!match) throw new Error(`No dollar amount in "${text}"`);
  const dollars = (match[1] ?? "0").replaceAll(",", "");
  const cents = (match[2] ?? "").padEnd(2, "0");
  return Number(dollars) * 100 + Number(cents);
}

/** The card for one gift, found by its title heading. Innermost match, so a list item around it never wins. */
export function giftCard(page: Page, title: string): Locator {
  return page
    .locator("article, li")
    .filter({ has: page.getByRole("heading", { name: title }) })
    .last();
}

/** The card's order button; the accessible name begins with "Order this gift". */
export function orderButton(scope: Page | Locator): Locator {
  return scope
    .getByRole("button", { name: /^Order this gift/ })
    .or(scope.getByRole("link", { name: /^Order this gift/ }))
    .first();
}

/** The first payment column's total on the builder's review step, in minor units. */
export async function reviewTotalMinor(page: Page): Promise<number> {
  const total = page
    .getByText("Total", { exact: true })
    .first()
    .locator("xpath=following-sibling::dd[1]");
  await expect(total).toContainText("$");
  return usdToMinor(await total.innerText());
}

/**
 * From a ready-made gift's review step: adds the details the gift arrives without (recipient,
 * card message, names on personalised items), if the step asks for them, and returns to review.
 */
export async function fillMissingDetails(page: Page): Promise<void> {
  const missing = page.getByRole("button", { name: /Add the missing details/i });
  const order = orderButton(page);
  await expect(missing.or(order)).toBeVisible();
  if (await missing.isVisible()) {
    await missing.click();
    await personaliseAndReview(page);
  }
}

/**
 * From the review step: presses its "Order this gift" action, fills the checkout form and
 * places the order. Same form as `checkoutAndPlace`, which starts from "Continue to checkout".
 */
export async function orderFromReview(
  page: Page,
  buyer: Buyer,
  mode: "Pay now" | "Cash on delivery",
): Promise<string> {
  await orderButton(page).click();
  await expect(page).toHaveURL(/\/checkout/);

  await page.getByLabel("Full name").fill(buyer.name);
  await page.getByLabel("Email").fill(buyer.email);
  await page.getByLabel("Phone").fill(buyer.phone);
  await page.getByLabel("Address line 1").fill(buyer.line1);
  await page.getByLabel("City").fill(buyer.city);
  await page.getByLabel(buyer.region.label).fill(buyer.region.value);
  if (buyer.postalCode) await page.getByLabel(buyer.postalCode.label).fill(buyer.postalCode.value);

  const choice = page.getByRole("radio", { name: new RegExp(mode, "i") });
  await choice.check({ force: true });
  await expect(choice).toBeChecked();

  await page.getByRole("button", { name: /Place order/i }).click();
  await page.waitForURL(/\/order\/GP-[A-Z]{2}-[A-Z0-9]{6}/);
  const number = /\/order\/(GP-[A-Z]{2}-[A-Z0-9]{6})/.exec(page.url())?.[1];
  expect(number).toBeTruthy();
  return number as string;
}
