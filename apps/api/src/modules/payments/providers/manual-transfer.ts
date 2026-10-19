import type { PaymentContext, PaymentProvider } from "@giftpop/contracts";

/** Customer sends money by bank or wallet transfer; staff record it when it arrives. */
export const manualTransferProvider: PaymentProvider = {
  method: "manual_transfer",
  prepare: async () => ({ method: "manual_transfer" }),
  instructions: (context: PaymentContext) => ({
    method: "manual_transfer",
    text: context.paymentInstructions,
  }),
};
