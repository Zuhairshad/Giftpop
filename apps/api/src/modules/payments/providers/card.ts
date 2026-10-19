import type { PaymentProvider } from "@giftpop/contracts";

import { AppError } from "../../../lib/errors";

function notAvailable(): never {
  throw new AppError("NOT_AVAILABLE", 503, "Card payments are not available yet");
}

/** Registered so the slot exists behind the same interface; nothing is implemented. */
export const cardProvider: PaymentProvider = {
  method: "card",
  prepare: async () => notAvailable(),
  instructions: () => notAvailable(),
};
