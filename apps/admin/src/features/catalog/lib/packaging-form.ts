import { SavePackagingRequestSchema } from "@giftpop/contracts";
import type { Asset, Packaging, SavePackagingRequest } from "@giftpop/contracts";
import { LAYOUT_TYPES } from "@giftpop/renderer";
import type { z } from "zod";

/** The form library's input type: the contract's input, layers included. */
export type PackagingFormInput = z.input<typeof SavePackagingRequestSchema>;

/** What the packaging form edits. Layer images are handled by the uploaders. */
export type PackagingFormValues = Omit<PackagingFormInput, "layers">;

export interface PackagingLayers {
  back?: Asset | undefined;
  front?: Asset | undefined;
}

export function emptyPackagingValues(): PackagingFormValues {
  return {
    slug: "",
    name: "",
    description: "",
    kind: "box",
    layoutType: LAYOUT_TYPES[0] ?? "",
    minItems: 4,
    maxItems: 9,
    capacityUnits: 18,
    wrapperColors: [{ name: "Kraft", hex: "#c8a27a" }],
    ribbonColors: [{ name: "Red", hex: "#c0392b" }],
    active: true,
    sortOrder: 0,
  };
}

export function packagingToFormValues(packaging: Packaging): PackagingFormValues {
  return {
    slug: packaging.slug,
    name: packaging.name,
    description: packaging.description,
    kind: packaging.kind,
    layoutType: packaging.layoutType,
    minItems: packaging.minItems,
    maxItems: packaging.maxItems,
    capacityUnits: packaging.capacityUnits,
    wrapperColors: packaging.wrapperColors.map((colour) => ({ ...colour })),
    ribbonColors: packaging.ribbonColors.map((colour) => ({ ...colour })),
    active: packaging.active,
    sortOrder: packaging.sortOrder,
  };
}

/** A URL-safe slug for a name: "Classic Bouquet!" becomes "classic-bouquet". */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The request body for POST or PUT: the validated form values plus the committed layer images. */
export function buildSavePackagingRequest(
  values: SavePackagingRequest,
  layers: PackagingLayers,
): SavePackagingRequest {
  return SavePackagingRequestSchema.parse({
    ...values,
    layers: {
      ...(layers.back ? { back: layers.back } : {}),
      ...(layers.front ? { front: layers.front } : {}),
    },
  });
}

/** Layout types for the select: the registry, plus a saved one the registry no longer knows. */
export function layoutOptions(current: string): { value: string; known: boolean }[] {
  const options = LAYOUT_TYPES.map((value) => ({ value: String(value), known: true }));
  if (current !== "" && !options.some((option) => option.value === current)) {
    options.push({ value: current, known: false });
  }
  return options;
}
