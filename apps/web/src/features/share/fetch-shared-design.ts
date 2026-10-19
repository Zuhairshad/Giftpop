import { SharedDesignViewSchema, ShareIdSchema } from "@giftpop/contracts";
import type { SharedDesignView } from "@giftpop/contracts";
import { cache } from "react";

import { ApiError, apiRequest } from "@/lib/api";

/**
 * Loads a shared gift on the server. Answers null for a malformed id or an unknown gift;
 * any other failure throws so the route's error page shows. Cached per request so
 * `generateMetadata` and the page share one call.
 */
export const fetchSharedDesign = cache(
  async (rawShareId: string): Promise<SharedDesignView | null> => {
    const shareId = ShareIdSchema.safeParse(rawShareId);
    if (!shareId.success) return null;
    try {
      return await apiRequest(`/designs/${shareId.data}`, SharedDesignViewSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
);
