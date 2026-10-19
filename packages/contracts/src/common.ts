import { z } from "zod";

/** Mongo ObjectId as a 24-char hex string. */
export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export type ObjectId = z.infer<typeof ObjectIdSchema>;

/** ISO 8601 timestamp, the wire format for every date in the API. */
export const IsoDateTimeSchema = z.iso.datetime();
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

/** `#rgb` or `#rrggbb`. */
export const HexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid colour");
export type HexColor = z.infer<typeof HexColorSchema>;

/** ISO 3166-1 alpha-2, upper case. */
export const CountryCodeSchema = z.string().regex(/^[A-Z]{2}$/, "Invalid country code");
export type CountryCode = z.infer<typeof CountryCodeSchema>;

/** A country code in a URL or query string: `pk` and `PK` both parse to `PK`. */
export const CountryParamSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(CountryCodeSchema);
