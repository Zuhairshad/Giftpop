import { CountrySchema, ItemSchema, PackagingSchema, paginatedSchema } from "@giftpop/contracts";
import { z } from "zod";

/**
 * Response shapes for the catalog admin endpoints. The contracts name the entities;
 * these only accept either a bare entity or one wrapped under its name, and either a
 * bare list or a paginated one, so the UI does not depend on that detail of the API.
 */
export const ItemResponseSchema = z.union([
  ItemSchema,
  z.object({ item: ItemSchema }).transform((value) => value.item),
]);

export const PackagingResponseSchema = z.union([
  PackagingSchema,
  z.object({ packaging: PackagingSchema }).transform((value) => value.packaging),
]);

export const CountryResponseSchema = z.union([
  CountrySchema,
  z.object({ country: CountrySchema }).transform((value) => value.country),
]);

export const CountryListSchema = z.array(CountrySchema);

export const ItemPageSchema = paginatedSchema(ItemSchema);

export const PackagingListSchema = z
  .union([z.array(PackagingSchema), paginatedSchema(PackagingSchema)])
  .transform((value) => (Array.isArray(value) ? value : value.items));

export const CategoryListSchema = z.union([
  z.array(z.string()),
  z.object({ categories: z.array(z.string()) }).transform((value) => value.categories),
]);
