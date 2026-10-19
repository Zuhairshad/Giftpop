import { z } from "zod";

import { CountryCodeSchema, HexColorSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";

export const CARD_MESSAGE_MAX_LENGTH = 200;
export const RECIPIENT_NAME_MAX_LENGTH = 40;
/** Hard ceiling for a name on one item; each item sets its own lower limit. */
export const ITEM_NAME_MAX_LENGTH = 40;
export const MAX_QTY_PER_LINE = 20;
export const MAX_DESIGN_LINES = 50;

export const DesignItemSchema = z.object({
  itemId: ObjectIdSchema,
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
  /** Position of this line in the arrangement (0-based, unique within a design). */
  slot: z.number().int().nonnegative(),
});
export type DesignItem = z.infer<typeof DesignItemSchema>;

export const PersonalisationSchema = z.object({
  cardMessage: z.string().max(CARD_MESSAGE_MAX_LENGTH).default(""),
  recipientName: z.string().max(RECIPIENT_NAME_MAX_LENGTH).default(""),
  /** Name on a personalizable item, keyed by item id. */
  itemNames: z.record(ObjectIdSchema, z.string().max(ITEM_NAME_MAX_LENGTH)).default({}),
});
export type Personalisation = z.infer<typeof PersonalisationSchema>;

export const DesignSchema = z
  .object({
    packagingId: ObjectIdSchema,
    items: z.array(DesignItemSchema).max(MAX_DESIGN_LINES),
    wrapperColor: HexColorSchema,
    ribbonColor: HexColorSchema,
    /** Same design and seed always render the same arrangement. */
    arrangementSeed: z.number().int().min(0).max(0xffffffff),
    personalisation: PersonalisationSchema.default({
      cardMessage: "",
      recipientName: "",
      itemNames: {},
    }),
  })
  .refine((d) => new Set(d.items.map((i) => i.slot)).size === d.items.length, {
    message: "Item slots must be unique",
    path: ["items"],
  })
  .refine((d) => new Set(d.items.map((i) => i.itemId)).size === d.items.length, {
    message: "Each item may appear on one line only; use qty for more",
    path: ["items"],
  });
export type Design = z.infer<typeof DesignSchema>;

export const ShareIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,24}$/);
export type ShareId = z.infer<typeof ShareIdSchema>;

/** A design saved so it can be shared at `/g/<shareId>`. */
export const SavedDesignSchema = z.object({
  id: ObjectIdSchema,
  shareId: ShareIdSchema,
  country: CountryCodeSchema,
  design: DesignSchema,
  createdAt: IsoDateTimeSchema,
});
export type SavedDesign = z.infer<typeof SavedDesignSchema>;

export const SaveDesignRequestSchema = z.object({
  country: CountryCodeSchema,
  design: DesignSchema,
});
export type SaveDesignRequest = z.infer<typeof SaveDesignRequestSchema>;
