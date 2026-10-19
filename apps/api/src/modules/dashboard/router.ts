import { DashboardSummarySchema } from "@giftpop/contracts";
import { Router } from "express";

import { requireStaff } from "../../middleware/require-staff";

import { getDashboardSummary } from "./service";

export interface DashboardRouterOptions {
  /** Injectable clock so tests can fix time. */
  now?: () => Date;
}

export function createDashboardRouter(options: DashboardRouterOptions = {}): Router {
  const now = options.now ?? (() => new Date());
  const router = Router();

  router.get("/", requireStaff(), async (_req, res, next) => {
    try {
      const summary = await getDashboardSummary(now());
      res.json(DashboardSummarySchema.parse(summary));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/** Mounted at `/admin/dashboard`; uses the real clock. */
export const dashboardRouter: Router = createDashboardRouter();
