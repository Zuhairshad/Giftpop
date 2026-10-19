import { Router } from "express";

import { isDbReady } from "./db";

/** `/health` is liveness (no DB). `/ready` is readiness (needs Mongo). Mounted at the app root. */
export function createHealthRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/ready", (_req, res) => {
    if (isDbReady()) {
      res.json({ status: "ready" });
      return;
    }
    res.status(503).json({ error: { code: "INTERNAL", message: "Database is not connected" } });
  });

  return router;
}
