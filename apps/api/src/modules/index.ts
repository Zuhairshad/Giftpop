import type { Router } from "express";

import { assetsRouter } from "./assets/router";
import { authRouter } from "./auth/router";
import { catalogRouter } from "./catalog/router";
import { countriesRouter } from "./countries/router";
import { designsRouter } from "./designs/router";
import { quotesRouter } from "./quotes/router";
import { staffRouter } from "./staff/router";

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
];
