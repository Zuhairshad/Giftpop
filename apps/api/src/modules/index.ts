import type { Router } from "express";

import { adminOrdersRouter } from "./admin-orders/router";
import { assetsRouter } from "./assets/router";
import { authRouter } from "./auth/router";
import { catalogRouter } from "./catalog/router";
import { countriesRouter } from "./countries/router";
import { dashboardRouter } from "./dashboard/router";
import { designsRouter } from "./designs/router";
import { metricsRouter } from "./metrics/router";
import { notificationsRouter } from "./notifications/router";
import { ordersRouter } from "./orders/router";
import { partnersRouter } from "./partners/router";
import { paymentsRouter } from "./payments/router";
import { quotesRouter } from "./quotes/router";
import { staffRouter } from "./staff/router";
import { templatesRouter } from "./templates/router";

export interface ApiModule {
  /** Mount path under `/v1`, for example `/countries`. */
  path: string;
  router: Router;
}

/** Every API module registers here; `app.ts` mounts the list under `/v1`. */
export const modules: ApiModule[] = [
  { path: "/auth", router: authRouter },
  { path: "/staff", router: staffRouter },
  { path: "/countries", router: countriesRouter },
  { path: "/catalog", router: catalogRouter },
  { path: "/assets", router: assetsRouter },
  { path: "/designs", router: designsRouter },
  { path: "/quotes", router: quotesRouter },
  { path: "/orders", router: ordersRouter },
  // Payment proof lives under /orders/:number/payment-proof; both routers share the prefix.
  { path: "/orders", router: paymentsRouter },
  { path: "/notifications", router: notificationsRouter },
  { path: "/partner-requests", router: partnersRouter },
  { path: "/templates", router: templatesRouter },
  // Staff only (each router guards its own routes with requireStaff).
  { path: "/admin/orders", router: adminOrdersRouter },
  { path: "/admin/dashboard", router: dashboardRouter },
  { path: "/admin/metrics", router: metricsRouter },
];
