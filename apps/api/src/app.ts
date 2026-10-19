import { randomUUID } from "node:crypto";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import type { Env } from "./env";
import { createHealthRouter } from "./health";
import type { Logger } from "./logger";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { modules as registry, type ApiModule } from "./modules";

export interface AppOptions {
  env: Pick<Env, "CORS_ORIGINS">;
  logger: Logger;
  /** Defaults to the registry; tests pass their own routers. */
  modules?: ApiModule[];
}

export function createApp({ env, logger, modules = registry }: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id = typeof incoming === "string" && incoming.length <= 100 ? incoming : randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use(createHealthRouter());

  for (const module of modules) {
    app.use(`/v1${module.path}`, module.router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
