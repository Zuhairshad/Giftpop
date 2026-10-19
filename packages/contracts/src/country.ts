import { z } from "zod";

import { CountryCodeSchema } from "./common";
import { CurrencyCodeSchema, MinorUnitsSchema } from "./money";
import { PaymentModeSchema } from "./payment";

/** The nine countries Giftpop launches in. Others are data, added by admins. */
export const LAUNCH_COUNTRY_CODES = ["US", "GB", "SA", "IN", "PK", "CN", "AU", "TR", "CA"] as const;
export const LaunchCountryCodeSchema = z.enum(LAUNCH_COUNTRY_CODES);
export type LaunchCountryCode = z.infer<typeof LaunchCountryCodeSchema>;

export { CountryCodeSchema };

export const CountryStatusSchema = z.enum(["live", "coming_soon"]);
export type CountryStatus = z.infer<typeof CountryStatusSchema>;

const AddressFieldRuleSchema = z.object({
  required: z.boolean(),
  /** What the customer sees: "State", "County", "Province", "ZIP", "Postcode". */
  label: z.string().min(1).max(40),
});

export const AddressFormatSchema = z.object({
  region: AddressFieldRuleSchema,
  postalCode: AddressFieldRuleSchema,
});
export type AddressFormat = z.infer<typeof AddressFormatSchema>;

export const ShippingRuleSchema = z.object({
  flatMinor: MinorUnitsSchema.nonnegative(),
  /** Shipping is free when goods (before any discount) reach this amount. */
  freeOverMinor: MinorUnitsSchema.nonnegative().optional(),
  deliveryDays: z
    .object({ min: z.number().int().nonnegative(), max: z.number().int().nonnegative() })
    .refine((days) => days.min <= days.max, "min must not exceed max"),
});
export type ShippingRule = z.infer<typeof ShippingRuleSchema>;

export const CountrySchema = z.object({
  code: CountryCodeSchema,
  name: z.string().min(1).max(80),
  currency: CurrencyCodeSchema,
  status: CountryStatusSchema,
  paymentModes: z.array(PaymentModeSchema),
  shipping: ShippingRuleSchema,
  addressFormat: AddressFormatSchema,
  /** Text the admin writes (bank account, wallet number), shown after ordering. */
  paymentInstructions: z.string().max(2000),
});
export type Country = z.infer<typeof CountrySchema>;

/** What the storefront needs to list a country. */
export const CountrySummarySchema = CountrySchema.pick({
  code: true,
  name: true,
  currency: true,
  status: true,
});
export type CountrySummary = z.infer<typeof CountrySummarySchema>;

export const UpdateCountryRequestSchema = CountrySchema.omit({ code: true }).partial();
export type UpdateCountryRequest = z.infer<typeof UpdateCountryRequestSchema>;
