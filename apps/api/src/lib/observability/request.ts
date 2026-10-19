import { randomUUID } from "node:crypto";

import type { Request, RequestHandler } from "express";

import type { Logger } from "../../logger";

import { runWithRequestContext } from "./context";

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Accepts a caller's id only when it is short and plain; otherwise makes a new one. */
export function resolveRequestId(incoming: unknown): string {
  return typeof incoming === "string" && SAFE_ID.test(incoming) ? incoming : randomUUID();
}

/** The route pattern ("/v1/admin/orders/:id"), never the raw URL: ids and queries can be personal. */
export function routePattern(req: Request): string {
  const path: unknown = req.route && (req.route as { path?: unknown }).path;
  if (typeof path !== "string") return "unmatched";
  return `${req.baseUrl}${path === "/" ? "" : path}` || "/";
}

export interface RequestObservabilityOptions {
  logger: Logger;
  /** Paths logged at debug so probes do not drown the log. */
  quietPaths?: readonly string[];
  now?: () => number;
}

/**
 * First middleware in the app: assigns the request id, returns it as a header, keeps it in
 * async context so service logs carry it, and writes one access line per request.
 */
export function requestObservability(options: RequestObservabilityOptions): RequestHandler {
  const { logger, quietPaths = ["/health", "/ready"], now = () => performance.now() } = options;

  return (req, res, next) => {
    const requestId = resolveRequestId(req.headers["x-request-id"]);
    res.setHeader("x-request-id", requestId);
    req.id = requestId;
    req.log = logger.child({ requestId });
    const startedAt = now();

    // The route is only known while the handler runs; later the routers have unwound.
    let route = "unmatched";
    const end = res.end.bind(res) as typeof res.end;
    res.end = ((...args: Parameters<typeof res.end>) => {
      route = routePattern(req);
      return end(...args);
    }) as typeof res.end;

    res.once("close", () => {
      const status = res.statusCode;
      const level =
        quietPaths.includes(route) && status < 400
          ? "debug"
          : status >= 500
            ? "error"
            : status >= 400
              ? "warn"
              : "info";
      req.log[level](
        {
          method: req.method,
          route,
          status,
          durationMs: Math.round(now() - startedAt),
          ...(res.writableFinished ? {} : { aborted: true }),
        },
        "request completed",
      );
    });

    runWithRequestContext({ requestId }, next);
  };
}
