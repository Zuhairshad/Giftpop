import { pino, type DestinationStream, type Logger } from "pino";

import type { Env } from "./env";
import { getRequestId } from "./lib/observability/context";
import { maskRecord, maskText } from "./lib/observability/mask";

export type { Logger };

/**
 * Logger for the whole API. Every line gets the request id (from async context when a request
 * is running) and has phone numbers, emails and sensitive keys masked, in objects, errors and
 * message text. `destination` is for tests that capture output.
 */
export function createLogger(
  env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">,
  destination?: DestinationStream,
): Logger {
  const options = {
    level: env.NODE_ENV === "test" && env.LOG_LEVEL === "info" ? "silent" : env.LOG_LEVEL,
    // Errors are masked by `formatters.log`; keep them as plain objects.
    serializers: { err: (value: unknown) => value },
    mixin(_merge: object, _level: number, self: Logger) {
      const requestId = getRequestId();
      // A child logger made for a request already carries it as a binding.
      return requestId && !("requestId" in self.bindings()) ? { requestId } : {};
    },
    formatters: {
      log: (object: Record<string, unknown>) => maskRecord(object),
    },
    hooks: {
      logMethod(this: Logger, args: unknown[], method: (...rest: unknown[]) => void) {
        method.apply(
          this,
          args.map((arg) => (typeof arg === "string" ? maskText(arg) : arg)),
        );
      },
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
