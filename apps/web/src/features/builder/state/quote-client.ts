import { QuoteResponseSchema } from "@giftpop/contracts";
import type { QuoteRequest, QuoteResponse } from "@giftpop/contracts";

import { apiRequest } from "@/lib/api";

/** POST /quotes from the browser. The body is the country and the design; the server owns every price. */
export function fetchQuote(request: QuoteRequest, signal: AbortSignal): Promise<QuoteResponse> {
  return apiRequest("/quotes", QuoteResponseSchema, { method: "POST", body: request, signal });
}
