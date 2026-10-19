import type { Logger } from "../../logger";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requestObservability`; carries the request id on every line. */
      log: Logger;
      /** The id returned in the `X-Request-Id` response header. */
      id: string;
    }
  }
}

export {};
