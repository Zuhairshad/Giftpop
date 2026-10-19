import type { Money, Order, PaymentMethod, PaymentMode, PaymentProvider } from "@giftpop/contracts";

import { cardProvider } from "./card";
import { codProvider } from "./cod";
import { manualTransferProvider } from "./manual-transfer";

const providers: Record<PaymentMethod, PaymentProvider> = {
  manual_transfer: manualTransferProvider,
  cod: codProvider,
  card: cardProvider,
};

/** Providers by method, for staff recording a payment and for the future card checkout. */
export function providerForMethod(method: PaymentMethod): PaymentProvider {
  return providers[method];
}

/** The provider behind an order's payment mode. Never chosen by country. */
export function providerFor(mode: PaymentMode): PaymentProvider {
  return mode === "prepaid" ? providers.manual_transfer : providers.cod;
}

/**
 * What the customer must pay now and how: `prepaid` owes the full total, `cod` the advance;
 * both are `quote.dueNowMinor`, computed by contracts/pricing at order time.
 */
export function describePayment(
  order: Pick<Order, "number" | "country" | "paymentMode" | "quote">,
  countryInstructions: string,
): { method: PaymentMethod; amountDue: Money; text: string } {
  const provider = providerFor(order.paymentMode);
  const amountDue: Money = { amountMinor: order.quote.dueNowMinor, currency: order.quote.currency };
  const { method, text } = provider.instructions({
    orderNumber: order.number,
    country: order.country,
    amountDue,
    paymentInstructions: countryInstructions,
  });
  return { method, amountDue, text };
}
