import { SaveDesignRequestSchema, ShareIdSchema, type SaveDesignRequest } from "@giftpop/contracts";
import { Router, type Request, type RequestHandler } from "express";
import { z } from "zod";

import { validateBody, validateParams } from "../../lib/validate";
import { createIpLimiter } from "../quotes/rate-limit";

import { defaultSaveStore, SAVES_PER_MINUTE } from "./rate-limit";
import { getSharedDesign, saveDesign } from "./service";

const ShareParamsSchema = z.object({ shareId: ShareIdSchema });
type ShareParams = z.infer<typeof ShareParamsSchema>;

const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export interface DesignsRouterOptions {
  /** Replace the save limiter, for example with a tighter or fresh one in tests. */
  saveLimiter?: RequestHandler;
}

export function createDesignsRouter({
  saveLimiter = createIpLimiter({
    limit: SAVES_PER_MINUTE,
    store: defaultSaveStore,
    message: "Too many saves. Try again in a minute.",
  }),
}: DesignsRouterOptions = {}): Router {
  const router = Router();

  router.post("/", saveLimiter, validateBody(SaveDesignRequestSchema), async (req, res) => {
    const { country, design } = req.body as SaveDesignRequest;
    res.status(201).json(await saveDesign(country, design));
  });

  router.get(
    "/:shareId",
    validateParams(ShareParamsSchema),
    async (req: Request<ShareParams>, res) => {
      const view = await getSharedDesign(req.params.shareId);
      res.set("Cache-Control", PUBLIC_CACHE).json(view);
    },
  );

  return router;
}

export const designsRouter: Router = createDesignsRouter();
