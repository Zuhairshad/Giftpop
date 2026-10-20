import { SaveItemRequestSchema } from "@giftpop/contracts";
import type { Asset, Item, SaveItemRequest } from "@giftpop/contracts";
import type { z } from "zod";

import { DEFAULT_PICKER_STYLE, resolvePickerStyle } from "./item-labels";

/** The form library's input type: the contract's input, image included. */
export type ItemFormInput = z.input<typeof SaveItemRequestSchema>;

/** What the item form edits. The image is handled by the uploader, not by form fields. */
export type ItemFormValues = Omit<ItemFormInput, "image">;

export const DEFAULT_PERSONALIZATION_MAX_LENGTH = 20;

export function emptyItemValues(): ItemFormValues {
  return {
    name: "",
    category: "",
    shape: "other",
    color: "#cccccc",
    sizeUnits: 1,
    personalizable: false,
    pickerStyle: DEFAULT_PICKER_STYLE,
    active: true,
    sortOrder: 0,
  };
}

export function itemToFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    category: item.category,
    shape: item.shape,
    color: item.color,
    sizeUnits: item.sizeUnits,
    personalizable: item.personalizable,
    ...(item.personalizationMaxLength !== undefined
      ? { personalizationMaxLength: item.personalizationMaxLength }
      : {}),
    pickerStyle: resolvePickerStyle(item.pickerStyle),
    active: item.active,
    sortOrder: item.sortOrder,
  };
}

/**
 * The request body for POST or PUT: the validated form values plus the committed image.
 * A name limit is only kept while the item is personalizable. A missing picker style is sent as
 * tile, so a save always states how the item is offered.
 */
export function buildSaveItemRequest(
  values: SaveItemRequest,
  image: Asset | undefined,
): SaveItemRequest {
  const { personalizationMaxLength, ...rest } = values;
  return SaveItemRequestSchema.parse({
    ...rest,
    pickerStyle: resolvePickerStyle(values.pickerStyle),
    image,
    ...(values.personalizable && personalizationMaxLength !== undefined
      ? { personalizationMaxLength }
      : {}),
  });
}
