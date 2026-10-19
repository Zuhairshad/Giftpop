import { SaveDesignResponseSchema } from "@giftpop/contracts";
import type {
  CountryCode,
  Design,
  SaveDesignRequest,
  SaveDesignResponse,
} from "@giftpop/contracts";

import { ApiError, ApiNetworkError, apiRequest } from "@/lib/api";

/** Saves the design so it can be shared. The body has a country and a design and no price. */
export function saveDesign(country: CountryCode, design: Design): Promise<SaveDesignResponse> {
  const body: SaveDesignRequest = { country, design };
  return apiRequest("/designs", SaveDesignResponseSchema, { method: "POST", body });
}

/** Plain words for a failed save. */
export function describeSaveError(error: unknown): string {
  if (error instanceof ApiNetworkError) return error.message;
  if (error instanceof ApiError && error.code === "DESIGN_INVALID") {
    return "This gift cannot be saved yet. Go back and fix the problems listed above.";
  }
  return "We could not save your gift. Try again in a moment.";
}
