import { API_URL, STAFF_EMAIL, STAFF_PASSWORD } from "./env";

/** The seed loads no featured templates, so global setup makes one for the US home. */
export const FEATURED_TEMPLATE_TITLE = "E2E featured bouquet";

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

async function json<T>(response: Response, what: string): Promise<T> {
  if (!response.ok) throw new Error(`${what} failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as T;
}

/**
 * Makes sure one active template titled `FEATURED_TEMPLATE_TITLE` exists for the US,
 * through the same public and staff API routes the apps use. Safe to call on every run.
 * Returns the staff session cookie so setup logs in once (login is limited to 5 per minute).
 */
export async function ensureFeaturedTemplate(): Promise<string> {
  const login = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Staff login failed: ${login.status}`);
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  const staff = { "content-type": "application/json", cookie };

  const existing = await json<{ title: string; active: boolean; countries: string[] }[]>(
    await fetch(`${API_URL}/v1/templates/admin`, { headers: staff }),
    "List templates",
  );
  if (
    existing.some(
      (t) => t.title === FEATURED_TEMPLATE_TITLE && t.active && t.countries.includes("US"),
    )
  ) {
    return cookie;
  }

  const catalog = await json<{ packagings: CatalogPackaging[]; items: CatalogItem[] }>(
    await fetch(`${API_URL}/v1/catalog?country=US`),
    "Catalog",
  );
  const bouquet = catalog.packagings.find((p) => p.packaging.slug === "bouquet" && p.inStock);
  if (!bouquet) throw new Error("The US catalog has no bouquet");
  const { packaging } = bouquet;
  // The smallest items first, so the minimum count always fits the capacity. Nameable items are
  // skipped: an order needs a name on each, and this template carries none.
  const picked = catalog.items
    .filter((entry) => entry.inStock && !entry.item.personalizable)
    .sort((a, b) => a.item.sizeUnits - b.item.sizeUnits)
    .slice(0, packaging.minItems);
  const units = picked.reduce((sum, entry) => sum + entry.item.sizeUnits, 0);
  if (picked.length < packaging.minItems || units > packaging.capacityUnits) {
    throw new Error("The US catalog cannot fill a bouquet");
  }

  const saved = await json<{ shareId: string }>(
    await fetch(`${API_URL}/v1/designs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country: "US",
        design: {
          packagingId: packaging.id,
          items: picked.map((entry, slot) => ({ itemId: entry.item.id, qty: 1, slot })),
          wrapperColor: packaging.wrapperColors[0]?.hex,
          ribbonColor: packaging.ribbonColors[0]?.hex,
          arrangementSeed: 7,
          personalisation: {
            cardMessage: "Thinking of you",
            recipientName: "Jordan",
            itemNames: {},
          },
        },
      }),
    }),
    "Save design",
  );
  await json(
    await fetch(`${API_URL}/v1/templates/admin`, {
      method: "POST",
      headers: staff,
      body: JSON.stringify({
        title: FEATURED_TEMPLATE_TITLE,
        description: "Made by the end-to-end tests.",
        shareId: saved.shareId,
        countries: ["US"],
      }),
    }),
    "Create template",
  );
  return cookie;
}
