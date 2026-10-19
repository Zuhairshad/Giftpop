import type { Router } from "express";

export interface ApiModule {
  /** Mount path under `/v1`, for example `/countries`. */
  path: string;
  router: Router;
}

/** Every API module registers here; `app.ts` mounts the list under `/v1`. */
export const modules: ApiModule[] = [];
