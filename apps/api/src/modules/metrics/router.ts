import { MetricsResponseSchema } from "@giftpop/contracts";
import { Router } from "express";

import { requireStaff } from "../../middleware/require-staff";

import { getMetrics } from "./service";

export interface MetricsRouterOptions {
  /** Injectable clock so tests can fix time. */
  now?: () => Date;
}

export function createMetricsRouter(options: MetricsRouterOptions = {}): Router {
  const now = options.now ?? (() => new Date());
  const router = Router();

  router.get("/", requireStaff(), async (_req, res, next) => {
    try {
      res.setHeader("cache-control", "no-store");
      res.json(MetricsResponseSchema.parse(await getMetrics(now())));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/** Mount at `/admin/metrics`; uses the real clock. */
export const metricsRouter: Router = createMetricsRouter();
