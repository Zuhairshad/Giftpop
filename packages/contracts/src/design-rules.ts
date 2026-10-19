import { z } from "zod";

import type { CountryCatalog } from "./catalog";
import { CARD_MESSAGE_MAX_LENGTH, RECIPIENT_NAME_MAX_LENGTH } from "./design";
import type { Design } from "./design";

export const DESIGN_PROBLEM_CODES = [
  "TOO_FEW_ITEMS",
  "TOO_MANY_ITEMS",
  "OVER_CAPACITY",
  "ITEM_UNAVAILABLE",
  "OUT_OF_STOCK",
  "TEXT_TOO_LONG",
  "PACKAGING_UNAVAILABLE",
] as const;
export const DesignProblemCodeSchema = z.enum(DESIGN_PROBLEM_CODES);
export type DesignProblemCode = z.infer<typeof DesignProblemCodeSchema>;

export const DesignProblemSchema = z.object({
  code: DesignProblemCodeSchema,
  /** Item the problem is about, when it is about one item. */
  itemId: z.string().optional(),
  /** Text field the problem is about: `cardMessage`, `recipientName` or `itemNames`. */
  field: z.string().optional(),
  message: z.string(),
});
export type DesignProblem = z.infer<typeof DesignProblemSchema>;

/**
 * Checks a design against what one country sells. Pure: no I/O, no clock.
 * Returns every problem found; an empty list means the design can be ordered.
 * The API runs it on every save, quote and order; the web builder runs it live.
 *
 * Naming a non-personalizable item counts as `TEXT_TOO_LONG` (its limit is 0).
 */
export function validateDesign(design: Design, catalog: CountryCatalog): DesignProblem[] {
  const problems: DesignProblem[] = [];

  const priced = catalog.packagings.find((p) => p.packaging.id === design.packagingId);
  if (!priced || !priced.packaging.active) {
    return [
      {
        code: "PACKAGING_UNAVAILABLE",
        message: `This format is not available in ${catalog.country}.`,
      },
    ];
  }
  if (!priced.inStock) {
    problems.push({ code: "OUT_OF_STOCK", message: `${priced.packaging.name} is out of stock.` });
  }
  const { minItems, maxItems, capacityUnits } = priced.packaging;

  let itemCount = 0;
  let usedUnits = 0;
  for (const line of design.items) {
    itemCount += line.qty;
    const entry = catalog.items.find((i) => i.item.id === line.itemId);
    if (!entry || !entry.item.active) {
      problems.push({
        code: "ITEM_UNAVAILABLE",
        itemId: line.itemId,
        message: `This item is not available in ${catalog.country}.`,
      });
      continue;
    }
    usedUnits += entry.item.sizeUnits * line.qty;
    if (!entry.inStock) {
      problems.push({
        code: "OUT_OF_STOCK",
        itemId: line.itemId,
        message: `${entry.item.name} is out of stock.`,
      });
    }
  }

  if (itemCount < minItems) {
    problems.push({
      code: "TOO_FEW_ITEMS",
      message: `Pick at least ${minItems} items (you have ${itemCount}).`,
    });
  }
  if (itemCount > maxItems) {
    problems.push({
      code: "TOO_MANY_ITEMS",
      message: `Pick at most ${maxItems} items (you have ${itemCount}).`,
    });
  }
  if (usedUnits > capacityUnits) {
    problems.push({
      code: "OVER_CAPACITY",
      message: `The items need ${usedUnits} units of space; ${priced.packaging.name} holds ${capacityUnits}.`,
    });
  }

  const { cardMessage, recipientName, itemNames } = design.personalisation;
  if (cardMessage.length > CARD_MESSAGE_MAX_LENGTH) {
    problems.push({
      code: "TEXT_TOO_LONG",
      field: "cardMessage",
      message: `The card message can be up to ${CARD_MESSAGE_MAX_LENGTH} characters.`,
    });
  }
  if (recipientName.length > RECIPIENT_NAME_MAX_LENGTH) {
    problems.push({
      code: "TEXT_TOO_LONG",
      field: "recipientName",
      message: `The recipient name can be up to ${RECIPIENT_NAME_MAX_LENGTH} characters.`,
    });
  }
  for (const [itemId, name] of Object.entries(itemNames)) {
    const entry = catalog.items.find((i) => i.item.id === itemId);
    const limit = entry?.item.personalizable ? (entry.item.personalizationMaxLength ?? 0) : 0;
    if (name.length > limit) {
      problems.push({
        code: "TEXT_TOO_LONG",
        itemId,
        field: "itemNames",
        message:
          limit === 0
            ? "This item cannot be personalised."
            : `The name on this item can be up to ${limit} characters.`,
      });
    }
  }

  return problems;
}
