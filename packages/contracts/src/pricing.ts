import { z } from "zod";

import {
  CurrencyCodeSchema,
  MinorUnitsSchema,
  addMoney,
  multiplyMoney,
  percentOfMinor,
  sumMoney,
} from "./money";
import type { Money } from "./money";
import { PaymentModeSchema } from "./payment";
import type { PaymentMode } from "./payment";

export const PaymentPolicySchema = z.object({
  prepaid: z.object({
    /** Percent taken off the goods when the customer pays in full now. Not applied to shipping. */
    goodsDiscountPercent: z.number().int().min(0).max(100),
  }),
  cod: z.object({
    /** Percent of the total paid now when the customer chooses cash on delivery. */
    advancePercent: z.number().int().min(0).max(100),
  }),
});
export type PaymentPolicy = z.infer<typeof PaymentPolicySchema>;

/**
 * The one place the payment percentages live. Admin-editable later.
 *
 * ASSUMPTION (docs/product.md, "Payment"): the owner wrote "Advance payment
 * 20% discount and cash on delivery 20% advance". Read as: prepaid gets 20%
 * off goods; cod pays a 20% advance of the total now.
 */
export const PAYMENT_POLICY: PaymentPolicy = {
  prepaid: { goodsDiscountPercent: 20 },
  cod: { advancePercent: 20 },
};

export interface QuoteShippingInput {
  flatMinor: number;
  freeOverMinor?: number | undefined;
}

export interface QuoteItemLine {
  unitPrice: Money;
  qty: number;
}

export interface QuoteInput {
  packagingPrice: Money;
  itemLines: readonly QuoteItemLine[];
  /** Total personalisation fee. Zero until the owner sets one. */
  personalisationFee: Money;
  shipping: QuoteShippingInput;
  mode: PaymentMode;
  policy: PaymentPolicy;
}

export const QuoteSchema = z.object({
  currency: CurrencyCodeSchema,
  mode: PaymentModeSchema,
  /** Packaging + items + personalisation, before any discount. */
  goodsMinor: MinorUnitsSchema,
  discountMinor: MinorUnitsSchema,
  shippingMinor: MinorUnitsSchema,
  /** goods - discount + shipping. */
  totalMinor: MinorUnitsSchema,
  dueNowMinor: MinorUnitsSchema,
  dueOnDeliveryMinor: MinorUnitsSchema,
});
export type Quote = z.infer<typeof QuoteSchema>;

/**
 * Prices a design. Pure integer maths; every rounding goes through
 * `percentOfMinor` (half up). Shipping is free when goods before discount
 * reach `freeOverMinor`, so the payment mode never changes shipping.
 */
export function computeQuote(input: QuoteInput): Quote {
  const { currency } = input.packagingPrice;
  const lineTotals = input.itemLines.map((line) => multiplyMoney(line.unitPrice, line.qty));
  const goods = addMoney(
    addMoney(input.packagingPrice, sumMoney(lineTotals, currency)),
    input.personalisationFee,
  );

  const { flatMinor, freeOverMinor } = input.shipping;
  const shippingMinor =
    freeOverMinor !== undefined && goods.amountMinor >= freeOverMinor ? 0 : flatMinor;

  if (input.mode === "prepaid") {
    const discountMinor = percentOfMinor(
      goods.amountMinor,
      input.policy.prepaid.goodsDiscountPercent,
    );
    const totalMinor = goods.amountMinor - discountMinor + shippingMinor;
    return {
      currency,
      mode: "prepaid",
      goodsMinor: goods.amountMinor,
      discountMinor,
      shippingMinor,
      totalMinor,
      dueNowMinor: totalMinor,
      dueOnDeliveryMinor: 0,
    };
  }

  const totalMinor = goods.amountMinor + shippingMinor;
  const dueNowMinor = percentOfMinor(totalMinor, input.policy.cod.advancePercent);
  return {
    currency,
    mode: "cod",
    goodsMinor: goods.amountMinor,
    discountMinor: 0,
    shippingMinor,
    totalMinor,
    dueNowMinor,
    dueOnDeliveryMinor: totalMinor - dueNowMinor,
  };
}

/** Both quotes side by side, as the review screen shows them. */
export function computeQuotes(
  input: Omit<QuoteInput, "mode">,
  modes: readonly PaymentMode[],
): Quote[] {
  return modes.map((mode) => computeQuote({ ...input, mode }));
}
