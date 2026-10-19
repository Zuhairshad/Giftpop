import { PaymentProofUploadFieldsSchema } from "@giftpop/contracts";
import { Router, type RequestHandler } from "express";
import { MemoryStore } from "express-rate-limit";
import { z } from "zod";

import { AppError } from "../../lib/errors";
import { getPrivateStorage, type Storage } from "../../lib/storage";
import { validateParams } from "../../lib/validate";
import { createIpLimiter } from "../quotes/rate-limit";

import { addPaymentProof } from "./proofs";
import { readProofUpload } from "./upload";

export const PROOFS_PER_MINUTE = 10;
const proofStore = new MemoryStore();
const ParamsSchema = z.object({ number: z.string().trim().min(1).max(40) });

export interface PaymentsRouterOptions {
  limiter?: RequestHandler;
  /** Must return the private storage: proofs are never public. */
  resolveStorage?: () => Storage;
}

/**
 * Mounted at `/v1/orders` next to the orders router.
 * `POST /:number/payment-proof`: public, multipart `contact` + `file`; 201 `PaymentProofUploadResponse`.
 */
export function createPaymentsRouter({
  limiter = createIpLimiter({
    limit: PROOFS_PER_MINUTE,
    store: proofStore,
    message: "Too many uploads. Try again in a minute.",
  }),
  resolveStorage = getPrivateStorage,
}: PaymentsRouterOptions = {}): Router {
  const router = Router();

  router.post(
    "/:number/payment-proof",
    limiter,
    validateParams(ParamsSchema),
    readProofUpload,
    async (req, res) => {
      const { contact } = PaymentProofUploadFieldsSchema.parse(req.body);
      const upload = req.file;
      if (!upload) throw new AppError("VALIDATION_ERROR", 400, "No file was uploaded");
      const { number } = req.params as z.infer<typeof ParamsSchema>;
      res.status(201).json(await addPaymentProof(resolveStorage(), number, contact, upload.buffer));
    },
  );

  return router;
}

export const paymentsRouter: Router = createPaymentsRouter();
