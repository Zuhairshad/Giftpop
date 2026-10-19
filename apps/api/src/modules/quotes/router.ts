import { QuoteRequestSchema, type QuoteRequest } from "@giftpop/contracts";
import { Router, type RequestHandler } from "express";

import { validateBody } from "../../lib/validate";

import { createIpLimiter, defaultQuoteStore, QUOTES_PER_MINUTE } from "./rate-limit";
import { quoteDesign } from "./service";

export interface QuotesRouterOptions {
  /** Replace the limiter, for example with a tighter or fresh one in tests. */
  limiter?: RequestHandler;
}

export function createQuotesRouter({
  limiter = createIpLimiter({
    limit: QUOTES_PER_MINUTE,
    store: defaultQuoteStore,
    message: "Too many price checks. Try again in a minute.",
  }),
}: QuotesRouterOptions = {}): Router {
  const router = Router();

  // The schema strips unknown keys, so a price sent by the client never reaches the service.
  router.post("/", limiter, validateBody(QuoteRequestSchema), async (req, res) => {
    const { country, design } = req.body as QuoteRequest;
    res.json(await quoteDesign(country, design));
  });

  return router;
}

export const quotesRouter: Router = createQuotesRouter();
