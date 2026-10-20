import type { Asset, Design, Item, ItemShape, Packaging } from "@giftpop/contracts";
import { isKnownLayoutType } from "@giftpop/renderer";

export interface ScenePreview {
  design: Design;
  packaging: Packaging;
  items: Item[];
}

const HEX_COLOUR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FALLBACK_COLOUR = "#cccccc";
const DEFAULT_WRAPPER_COLOUR = "#c8a27a";
const DEFAULT_RIBBON_COLOUR = "#c0392b";
const MAX_PREVIEW_COPIES = 20;
const MAX_PREVIEW_ITEMS = 40;

/** Stand-in items for a packaging preview, so each layout shows a mixed arrangement. */
const SAMPLE_SHAPES: readonly { shape: ItemShape; color: string }[] = [
  { shape: "flower", color: "#e0577a" },
  { shape: "bar", color: "#6b4226" },
  { shape: "jar", color: "#e8b04a" },
  { shape: "box", color: "#4a7fb5" },
  { shape: "mug", color: "#7a9e6b" },
];

/** A fixed, valid-looking id for preview data that never reaches the API. */
export function previewId(n: number): string {
  return n.toString(16).padStart(24, "0");
}

export function safeColour(value: string | undefined, fallback = FALLBACK_COLOUR): string {
  return value !== undefined && HEX_COLOUR.test(value) ? value : fallback;
}

function wholeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : fallback;
}

function baseDesign(packagingId: string): Omit<Design, "items"> {
  return {
    packagingId,
    wrapperColor: DEFAULT_WRAPPER_COLOUR,
    ribbonColor: DEFAULT_RIBBON_COLOUR,
    arrangementSeed: 7,
    personalisation: { cardMessage: "", recipientName: "", customRequest: "", itemNames: {} },
  };
}

export interface PreviewPackagingFields {
  name: string;
  layoutType: string;
  minItems: number;
  maxItems: number;
  wrapperColor?: string | undefined;
  ribbonColor?: string | undefined;
  layers?: { back?: Asset | undefined; front?: Asset | undefined } | undefined;
}

function previewPackaging(fields: PreviewPackagingFields): Packaging {
  const min = wholeNumber(fields.minItems, 1);
  const max = Math.max(min, wholeNumber(fields.maxItems, min));
  const wrapper = safeColour(fields.wrapperColor, DEFAULT_WRAPPER_COLOUR);
  const ribbon = safeColour(fields.ribbonColor, DEFAULT_RIBBON_COLOUR);
  return {
    id: previewId(1),
    slug: "preview",
    name: fields.name.trim() === "" ? "Preview" : fields.name,
    description: "",
    kind: "box",
    layoutType: fields.layoutType,
    minItems: min,
    maxItems: max,
    capacityUnits: max * 10,
    wrapperColors: [{ name: "Wrapper", hex: wrapper }],
    ribbonColors: [{ name: "Ribbon", hex: ribbon }],
    layers: {
      ...(fields.layers?.back ? { back: fields.layers.back } : {}),
      ...(fields.layers?.front ? { front: fields.layers.front } : {}),
    },
    active: true,
    sortOrder: 0,
  };
}

/** Can the renderer lay this out? An unregistered layout type would throw. */
export function canPreviewLayout(layoutType: string): boolean {
  return isKnownLayoutType(layoutType);
}

export interface ItemPreviewFields {
  name: string;
  shape: ItemShape;
  color: string;
  image?: Asset | undefined;
}

/** A few copies of one item in a stand-in packaging, to judge its image and anchor. */
export function buildItemPreview(
  item: ItemPreviewFields,
  layoutType: string,
  copies = 4,
): ScenePreview {
  const count = Math.min(MAX_PREVIEW_COPIES, wholeNumber(copies, 1));
  const packaging = previewPackaging({
    name: "Preview",
    layoutType,
    minItems: 1,
    maxItems: Math.max(count, 6),
  });
  const previewItem: Item = {
    id: previewId(100),
    name: item.name.trim() === "" ? "New item" : item.name,
    category: "preview",
    shape: item.shape,
    color: safeColour(item.color),
    sizeUnits: 1,
    personalizable: false,
    ...(item.image ? { image: item.image } : {}),
    active: true,
    sortOrder: 0,
  };
  return {
    packaging,
    items: [previewItem],
    design: {
      ...baseDesign(packaging.id),
      items: [{ itemId: previewItem.id, qty: count, slot: 0 }],
    },
  };
}

/** A packaging with sample items filling it about half way between its minimum and maximum. */
export function buildPackagingPreview(fields: PreviewPackagingFields): ScenePreview {
  const packaging = previewPackaging(fields);
  const total = Math.min(
    MAX_PREVIEW_ITEMS,
    Math.max(1, Math.round((packaging.minItems + packaging.maxItems) / 2)),
  );
  const lineCount = Math.min(total, SAMPLE_SHAPES.length);
  const base = Math.floor(total / lineCount);
  const extra = total % lineCount;

  const items: Item[] = [];
  const lines: Design["items"] = [];
  for (let index = 0; index < lineCount; index += 1) {
    const sample = SAMPLE_SHAPES[index];
    if (!sample) continue;
    const item: Item = {
      id: previewId(200 + index),
      name: `Sample ${sample.shape}`,
      category: "preview",
      shape: sample.shape,
      color: sample.color,
      sizeUnits: 1,
      personalizable: false,
      active: true,
      sortOrder: index,
    };
    items.push(item);
    lines.push({ itemId: item.id, qty: base + (index < extra ? 1 : 0), slot: index });
  }

  return {
    packaging,
    items,
    design: {
      ...baseDesign(packaging.id),
      wrapperColor: packaging.wrapperColors[0]?.hex ?? DEFAULT_WRAPPER_COLOUR,
      ribbonColor: packaging.ribbonColors[0]?.hex ?? DEFAULT_RIBBON_COLOUR,
      items: lines,
    },
  };
}
