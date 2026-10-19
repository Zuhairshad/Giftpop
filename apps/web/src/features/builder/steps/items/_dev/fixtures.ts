/**
 * Test and dev only. A small catalog for unit tests and for the dev-only builder page.
 * Production code never imports from this folder.
 */
import type { CatalogResponse, ItemShape, PricedItem, PricedPackaging } from "@giftpop/contracts";

export function oid(n: number): string {
  return n.toString(16).padStart(24, "0");
}

const WRAPPERS = [
  { name: "Blush", hex: "#f7c6d4" },
  { name: "Cream", hex: "#fff1d6" },
];
const RIBBONS = [
  { name: "Berry", hex: "#c41f56" },
  { name: "Gold", hex: "#e0a526" },
];

interface PackagingSeed {
  n: number;
  name: string;
  layoutType: string;
  min: number;
  max: number;
  capacity: number;
  price: number;
  inStock?: boolean;
  description?: string;
}

function packaging(seed: PackagingSeed): PricedPackaging {
  return {
    priceMinor: seed.price,
    inStock: seed.inStock ?? true,
    packaging: {
      id: oid(seed.n),
      slug: seed.name.toLowerCase().replace(/\s+/g, "-"),
      name: seed.name,
      description: seed.description ?? "",
      layoutType: seed.layoutType,
      minItems: seed.min,
      maxItems: seed.max,
      capacityUnits: seed.capacity,
      wrapperColors: WRAPPERS,
      ribbonColors: RIBBONS,
      layers: {},
      active: true,
      sortOrder: seed.n,
    },
  };
}

interface ItemSeed {
  n: number;
  name: string;
  category: string;
  shape: ItemShape;
  color: string;
  size: number;
  price: number;
  inStock?: boolean;
  image?: boolean;
}

/** A tiny inline SVG so the dev page shows a real `item.image` without any storage. */
const SAMPLE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="#ffd3e0" stroke="#c41f56" stroke-width="8"/><circle cx="100" cy="100" r="30" fill="#ffe08a"/></svg>',
)}`;

function item(seed: ItemSeed): PricedItem {
  return {
    priceMinor: seed.price,
    inStock: seed.inStock ?? true,
    item: {
      id: oid(100 + seed.n),
      name: seed.name,
      category: seed.category,
      shape: seed.shape,
      color: seed.color,
      sizeUnits: seed.size,
      personalizable: false,
      active: true,
      sortOrder: seed.n,
      ...(seed.image
        ? {
            image: {
              url: SAMPLE_IMAGE_URL,
              width: 200,
              height: 200,
              anchor: { x: 0.5, y: 0.5 },
            },
          }
        : {}),
    },
  };
}

export const FIXTURE_PACKAGINGS: PricedPackaging[] = [
  packaging({
    n: 1,
    name: "Classic bouquet",
    layoutType: "bouquet-fan",
    min: 3,
    max: 7,
    capacity: 12,
    price: 1500,
    description: "A hand-tied fan of your favourites.",
  }),
  packaging({
    n: 2,
    name: "Treat box",
    layoutType: "box-grid",
    min: 6,
    max: 10,
    capacity: 16,
    price: 2200,
    description: "A snug box that holds a little of everything.",
  }),
  packaging({
    n: 3,
    name: "Mini box",
    layoutType: "box-grid",
    min: 4,
    max: 4,
    capacity: 8,
    price: 1200,
  }),
  packaging({
    n: 4,
    name: "Grand basket",
    layoutType: "box-grid",
    min: 8,
    max: 14,
    capacity: 24,
    price: 3400,
    inStock: false,
  }),
];

export const FIXTURE_ITEMS: PricedItem[] = [
  item({
    n: 1,
    name: "Rose",
    category: "Flowers",
    shape: "flower",
    color: "#e8336d",
    size: 1,
    price: 300,
  }),
  item({
    n: 2,
    name: "Sunflower",
    category: "Flowers",
    shape: "flower",
    color: "#f2b705",
    size: 1,
    price: 350,
    image: true,
  }),
  item({
    n: 3,
    name: "Tulip",
    category: "Flowers",
    shape: "flower",
    color: "#b05cc7",
    size: 1,
    price: 280,
  }),
  item({
    n: 4,
    name: "Milk chocolate bar",
    category: "Sweets",
    shape: "bar",
    color: "#7b4a2d",
    size: 2,
    price: 450,
  }),
  item({
    n: 5,
    name: "Gummy jar",
    category: "Sweets",
    shape: "jar",
    color: "#ff8fb2",
    size: 3,
    price: 600,
  }),
  item({
    n: 6,
    name: "Salted caramel box",
    category: "Sweets",
    shape: "box",
    color: "#d99a4e",
    size: 3,
    price: 800,
    inStock: false,
  }),
  item({
    n: 7,
    name: "Soft bear",
    category: "Toys",
    shape: "soft-toy",
    color: "#c9a27a",
    size: 4,
    price: 1400,
  }),
  item({
    n: 8,
    name: "Party balloon",
    category: "Toys",
    shape: "balloon",
    color: "#4fa3ff",
    size: 1,
    price: 200,
  }),
  item({
    n: 9,
    name: "Rose-hip tea",
    category: "Care",
    shape: "bottle",
    color: "#c41f56",
    size: 2,
    price: 700,
  }),
  item({
    n: 10,
    name: "Hand cream",
    category: "Care",
    shape: "jar",
    color: "#bfeed8",
    size: 2,
    price: 900,
  }),
  item({
    n: 11,
    name: "Greeting card",
    category: "Cards",
    shape: "card",
    color: "#fff1d6",
    size: 1,
    price: 250,
  }),
  item({
    n: 12,
    name: "Coffee mug",
    category: "Cards",
    shape: "mug",
    color: "#6bb8a3",
    size: 3,
    price: 1000,
  }),
];

export function fixtureCatalog(overrides: Partial<CatalogResponse> = {}): CatalogResponse {
  return {
    country: "PK",
    currency: "PKR",
    status: "live",
    packagings: FIXTURE_PACKAGINGS,
    items: FIXTURE_ITEMS,
    categories: ["Flowers", "Sweets", "Toys", "Care", "Cards"],
    ...overrides,
  };
}
