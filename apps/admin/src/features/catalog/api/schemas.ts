import { CountrySchema, ItemSchema, PackagingSchema, paginatedSchema } from "@giftpop/contracts";
import { z } from "zod";

/**
 * Response shapes for the catalog admin endpoints. The API returns bare entities, a paginated
 * list for items and packagings, and a plain string list for categories.
 *
 * `ItemResponseSchema` and `PackagingListSchema` still accept a wrapped item and a bare
 * packaging list because `client.test.ts` pins that tolerance. The API sends neither.
 */
export const ItemResponseSchema = z.union([
  ItemSchema,
  z.object({ item: ItemSchema }).transform((value) => value.item),
]);

export const CountryListSchema = z.array(CountrySchema);

export const ItemPageSchema = paginatedSchema(ItemSchema);

export const PackagingListSchema = z
  .union([z.array(PackagingSchema), paginatedSchema(PackagingSchema)])
  .transform((value) => (Array.isArray(value) ? value : value.items));

export const CategoryListSchema = z.array(z.string());
