import { z } from "zod";

import { ItemSchema, PackagingSchema } from "./catalog";
import { CountryCodeSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { DesignSchema, SavedDesignSchema, ShareIdSchema } from "./design";
import { DesignProblemSchema } from "./design-rules";
import { CurrencyCodeSchema } from "./money";
import { QuoteSchema } from "./pricing";

/** Length of the url-safe id in `/g/<shareId>`. */
export const SHARE_ID_LENGTH = 10;

/** Ask the server what a design costs. There is no price in here: the server owns money. */
export const QuoteRequestSchema = z.object({
  country: CountryCodeSchema,
  design: DesignSchema,
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

/** One quote per payment mode the country allows, in the order the country lists them. */
export const QuoteResponseSchema = z.object({
  country: CountryCodeSchema,
  currency: CurrencyCodeSchema,
  quotes: z.array(QuoteSchema).min(1),
});
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

/** `details` of a 422 `DESIGN_INVALID` error from the quote, save and order routes. */
export const DesignInvalidDetailsSchema = z.object({
  problems: z.array(DesignProblemSchema).min(1),
});
export type DesignInvalidDetails = z.infer<typeof DesignInvalidDetailsSchema>;

export const SaveDesignResponseSchema = SavedDesignSchema;
export type SaveDesignResponse = z.infer<typeof SaveDesignResponseSchema>;

/**
 * What `/g/<shareId>` needs to draw a saved gift. Items that are no longer sold
 * in the country are still drawn (their documents are included) and listed in
 * `unavailableItemIds`, so an old link never fails.
 */
export const SharedDesignViewSchema = z.object({
  shareId: ShareIdSchema,
  country: CountryCodeSchema,
  currency: CurrencyCodeSchema,
  design: DesignSchema,
  packaging: PackagingSchema,
  /** False when the packaging is inactive or has no price in the country now. */
  packagingAvailable: z.boolean(),
  items: z.array(ItemSchema),
  unavailableItemIds: z.array(ObjectIdSchema),
  createdAt: IsoDateTimeSchema,
});
export type SharedDesignView = z.infer<typeof SharedDesignViewSchema>;
