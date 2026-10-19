import type { PaymentContext, PaymentProvider } from "@giftpop/contracts";

/**
 * Cash on delivery: the advance is paid by transfer now, the rest on delivery. The amount due
 * now arrives in the context from the order's quote.
 */
export const codProvider: PaymentProvider = {
  method: "cod",
  prepare: async () => ({ method: "cod" }),
  instructions: (context: PaymentContext) => ({
    method: "cod",
    text: context.paymentInstructions,
  }),
};
